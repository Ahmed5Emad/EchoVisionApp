import asyncio
import sys
import logging
import textwrap
from typing import Any
from bless import (
    BlessServer,
    BlessGATTCharacteristic,
    GATTCharacteristicProperties,
    GATTAttributePermissions
)
from blessed import Terminal

# The same UUIDs used in the React Native App
SERVICE_UUID = "0000ffe0-0000-1000-8000-00805f9b34fb"
CHARACTERISTIC_UUID = "0000ffe1-0000-1000-8000-00805f9b34fb"

term = Terminal()

class WhisperReceiver:
    def __init__(self):
        self.current_transcription = ""
        self.max_buffer_chars = 2000 # Keep buffer sane
        self.brightness = 60
        self.font_size = 24 # Base "size", will translate to width scaling

    def write_request(self, characteristic: BlessGATTCharacteristic, value: Any, **kwargs):
        try:
            # Decode the received data
            text = value.decode('utf-8')
            logging.info(f"Received: {repr(text)}") # Debug log
            
            # Check for commands (strip whitespace just in case)
            clean_text = text.strip()
            if clean_text.startswith("cmd:"):
                parts = clean_text.split(":")
                if len(parts) >= 3:
                    cmd = parts[1]
                    try:
                        val = int(parts[2])
                        if cmd == "brightness":
                            self.brightness = val
                        elif cmd == "font":
                            self.font_size = val
                        logging.info(f"Command processed: {cmd}={val}")
                    except ValueError:
                        logging.warning(f"Invalid command value: {parts[2]}")
                self.display()
                return

            # Otherwise, it's transcription data
            self.current_transcription += text
            
            # Keep buffer size under control
            if len(self.current_transcription) > self.max_buffer_chars:
                self.current_transcription = self.current_transcription[-self.max_buffer_chars:]
                
            self.display()
        except Exception as e:
            pass

    def get_color(self, is_bold=False):
        """Simple brightness simulation using terminal colors."""
        if self.brightness < 30:
            return term.black_bright # Dim gray
        elif self.brightness < 70:
            return term.white if not is_bold else term.white_bold
        else:
            return term.white_bold if not is_bold else term.white_bold # Highest contrast

    def display(self):
        # Get current terminal dimensions
        term_width = term.width or 40
        term_height = term.height or 10
        
        # Simulate font size by adjusting the wrapping width
        # A "larger" font means fewer characters per line.
        # Scale: font_size 24 is 1:1. font_size 40 is ~0.6x width. font_size 12 is ~2x width.
        # We'll use 24 as a baseline where it fills the screen width.
        scale_factor = 24 / self.font_size
        effective_width = max(10, int(term_width * scale_factor))
        
        # Wrap the transcription
        lines = []
        for paragraph in self.current_transcription.splitlines():
            if not paragraph:
                lines.append("")
                continue
            lines.extend(textwrap.wrap(paragraph, width=effective_width))
            
        # Determine how many lines we can show (reserve 1 for status)
        max_display_lines = term_height - 1
        display_lines = lines[-max_display_lines:] if len(lines) > max_display_lines else lines

        # Draw to screen
        color_func = self.get_color()
        color_bold_func = self.get_color(is_bold=True)
        
        print(term.clear())
        for i, line in enumerate(display_lines):
            # The most recent line can be highlighted
            if i == len(display_lines) - 1:
                print(color_bold_func(line))
            else:
                print(color_func(line))
        
        # Minimalist status line at the bottom
        if term_height > 0:
            status = f" [B:{self.brightness}% F:{self.font_size}] "
            with term.location(term_width - len(status), term_height - 1):
                # Status always visible even if brightness is low
                print(term.black_on_green(status))

async def main():
    receiver = WhisperReceiver()
    
    print(term.clear())
    print(term.bold_blue("=== EchoVision Glass Receiver ==="))
    print(term.yellow("Initializing Bluetooth..."))

    # Set up the server
    server = BlessServer(name="EchoVisionLinux")
    server.read_request_func = lambda char: b""
    server.write_request_func = receiver.write_request

    # Add Service
    await server.add_new_service(SERVICE_UUID)

    # Add Characteristic
    char_flags = (
        GATTCharacteristicProperties.write |
        GATTCharacteristicProperties.write_without_response
    )
    permissions = (
        GATTAttributePermissions.readable |
        GATTAttributePermissions.writeable
    )
    
    await server.add_new_characteristic(
        SERVICE_UUID,
        CHARACTERISTIC_UUID,
        char_flags,
        None,
        permissions
    )

    await server.start()
    
    # Initial status display
    print(term.clear())
    print(term.green("Ready for Glass."))
    print(term.cyan("Waiting for phone connection..."))
    
    try:
        while True:
            await asyncio.sleep(1)
    finally:
        await server.stop()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print(term.red("\nReceiver stopped."))
        sys.exit(0)
    except Exception as e:
        print(term.red(f"\nAn error occurred: {e}"))
        sys.exit(1)
