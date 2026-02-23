import asyncio
import sys
import tkinter as tk
from typing import Any
from bless import (
    BlessServer,
    BlessGATTCharacteristic,
    GATTCharacteristicProperties,
    GATTAttributePermissions
)
import arabic_reshaper
from bidi.algorithm import get_display

# Bluetooth UUIDs
SERVICE_UUID = "0000ffe0-0000-1000-8000-00805f9b34fb"
CHARACTERISTIC_UUID = "0000ffe1-0000-1000-8000-00805f9b34fb"

class GlassGUI:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("EchoVision Glass")
        
        # Set to fullscreen or small window
        self.root.geometry("600x400")
        self.root.attributes('-topmost', True)
        self.root.configure(bg='black')
        
        # Default settings
        self.brightness_val = 60 
        self.font_size = 24
        
        # Arabic-friendly fonts usually available on Linux
        self.font_family = "DejaVu Sans" 
        
        # Text display
        self.text_var = tk.StringVar(value="Waiting for connection...")
        self.label = tk.Label(
            self.root, 
            textvariable=self.text_var,
            fg=self.get_hex_color(),
            bg='black',
            font=(self.font_family, self.font_size),
            wraplength=560,
            justify="right",
            anchor="se"
        )
        self.label.pack(expand=True, fill="both", padx=20, pady=20)
        
        self.current_text = ""

    def get_hex_color(self):
        val = int(255 * (self.brightness_val / 100.0))
        val = max(val, 20) 
        return f'#{val:02x}{val:02x}{val:02x}'

    def update_text(self, text):
        self.current_text += text
        if len(self.current_text) > 1000:
            self.current_text = self.current_text[-1000:]
        
        # Reshape and reorder for proper Arabic display
        reshaped_text = arabic_reshaper.reshape(self.current_text)
        bidi_text = get_display(reshaped_text)
        
        # Detect if text contains Arabic (simplified)
        has_arabic = any("\u0600" <= c <= "\u06FF" for c in self.current_text)
        
        if has_arabic:
            self.label.config(justify="right", anchor="se")
        else:
            self.label.config(justify="left", anchor="sw")

        self.text_var.set(bidi_text)

    def update_settings(self, brightness=None, font_size=None):
        if brightness is not None:
            self.brightness_val = brightness
        if font_size is not None:
            self.font_size = font_size
            
        self.label.config(
            fg=self.get_hex_color(),
            font=(self.font_family, self.font_size)
        )

    def update_settings(self, brightness=None, font_size=None):
        if brightness is not None:
            self.brightness_val = brightness
        if font_size is not None:
            self.font_size = font_size
            
        self.label.config(
            fg=self.get_hex_color(),
            font=(self.font_family, self.font_size)
        )

class WhisperReceiver:
    def __init__(self, gui):
        self.gui = gui

    def write_request(self, characteristic: BlessGATTCharacteristic, value: Any, **kwargs):
        try:
            text = value.decode('utf-8')
            
            if text.startswith("cmd:"):
                parts = text.split(":")
                if len(parts) >= 3:
                    cmd = parts[1]
                    val = int(parts[2])
                    # Schedule GUI update on main thread
                    self.gui.root.after(0, lambda v=val, c=cmd: self.gui.update_settings(
                        brightness=v if c == "brightness" else None,
                        font_size=v if c == "font" else None
                    ))
                return

            # Update transcription
            self.gui.root.after(0, lambda t=text: self.gui.update_text(t))
        except Exception as e:
            print(f"Data Error: {e}")

async def main():
    gui = GlassGUI()
    receiver = WhisperReceiver(gui)
    
    server = BlessServer(name="EchoVisionLinux")
    server.read_request_func = lambda char: b""
    server.write_request_func = receiver.write_request

    await server.add_new_service(SERVICE_UUID)
    
    char_flags = (
        GATTCharacteristicProperties.write |
        GATTCharacteristicProperties.write_without_response
    )
    permissions = (
        GATTAttributePermissions.readable |
        GATTAttributePermissions.writeable
    )
    
    await server.add_new_characteristic(
        SERVICE_UUID, CHARACTERISTIC_UUID, char_flags, None, permissions
    )

    await server.start()
    print("BLE Server Started. GUI active.")

    try:
        while True:
            gui.root.update()
            await asyncio.sleep(0.01)
    except tk.TclError:
        print("GUI Closed.")
    finally:
        await server.stop()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        sys.exit(0)
