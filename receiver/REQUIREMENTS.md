# EchoVision Receiver Requirements

To run the Bluetooth receiver on your Linux system, the following dependencies are required.

## Python Packages

These are installed within the local virtual environment:

| Package | Purpose |
| :--- | :--- |
| `bless` | Provides the Bluetooth Low Energy (BLE) Peripheral/Server capability. |
| `blessed` | Handles the terminal UI, colors, and real-time screen clearing. |
| `arabic-reshaper` | Connects Arabic characters for proper rendering. |
| `python-bidi` | Handles right-to-left (RTL) layout and text reordering. |

### Installation Command
If your virtual environment is already set up, you can ensure they are installed by running:
```bash
./venv/bin/pip install bless blessed arabic-reshaper python-bidi
```

## System Dependencies (Linux)

The `bless` library interacts with the system's Bluetooth stack (BlueZ) via DBus. You may need to ensure the following are installed on your system:

- **BlueZ**: The official Linux Bluetooth protocol stack.
- **dbus**: Required for inter-process communication.
- **Python Headers**: Sometimes required for building native extensions (e.g., `python3-dev`).

### Permissions
On most Linux distributions, interacting with Bluetooth advertising requires special permissions. You have two options:
1. **Run with sudo**:
   ```bash
   sudo ./venv/bin/python receiver.py
   ```
2. **Configure BlueZ Permissions**: Add your user to the `bluetooth` group and ensure the Bluetooth service is configured to allow user advertising.
