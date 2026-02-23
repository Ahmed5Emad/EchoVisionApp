# EchoVision 🎙️

EchoVision is a powerful, privacy-focused React Native application that brings **local, on-device audio transcription** to your mobile device using OpenAI's Whisper model.
Built with **Expo** and **whisper.rn**, this app performs all inference directly on your phone. This means your audio **never leaves your device**, ensuring complete privacy and full offline functionality.

## ✨ Key Features

- **On-Device Transcription:** No internet connection required. Fast, accurate, and private.
- **Real-time & File Mode:** Transcribe live audio or process existing files.
- **Bluetooth Real-time Streaming:** Stream your transcriptions live to your Linux system via Bluetooth Low Energy (BLE).
- **GUI & Terminal Receivers:** Choose between a minimalist Terminal UI or a dedicated GUI for smart glasses.
- **Arabic Script Support:** Full support for Arabic transcription with proper character shaping and RTL layout.
- **Remote Controls:** Control font size and screen brightness directly from the mobile app.
- **Multiple Models:** Support for various Whisper model sizes (Tiny, Base, Small).
- **Modern UI:** A beautiful "Glassmorphism" design using `expo-blur` and linear gradients.
- **Hands-Free Mode:** Integrated silence detection and auto-start for seamless recording.

## 🛠️ Tech Stack

### Mobile App
- **Framework:** [Expo](https://expo.dev/) (SDK 54) / React Native
- **Core Engine:** [whisper.rn](https://github.com/mrousavy/whisper.rn)
- **Bluetooth:** `react-native-ble-plx`
- **Encoding:** `buffer` for UTF-8/Arabic support.

### Linux Receiver
- **Language:** Python 3
- **BLE Library:** `bless`
- **GUI:** `Tkinter` with `arabic-reshaper` and `python-bidi`.
- **Terminal UI:** `blessed`

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [Bun](https://bun.sh/) (Recommended)
- Android/iOS device for testing (Bluetooth functionality requires a physical device)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/echovision.git
    cd echovision
    ```

2.  **Install mobile dependencies:**
    ```bash
    bun install
    ```

3.  **Run the app:**
    ```bash
    npx expo run:android # or run:ios
    ```

## 📖 Usage Guide

### 1. Bluetooth Streaming (Linux)
EchoVision can stream transcriptions directly to your Linux system or Smart Glass display.

#### Set up the Linux Receiver:
1. Navigate to the receiver directory:
   ```bash
   cd receiver
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate
   ```
3. Install requirements:
   ```bash
   pip install bless blessed arabic-reshaper python-bidi
   ```
4. Run the GUI receiver (recommended for Glass/Screens):
   ```bash
   sudo ./venv/bin/python gui_receiver.py
   ```
   Or the terminal receiver:
   ```bash
   sudo ./venv/bin/python receiver.py
   ```

#### Remote Control:
Use the **Home** screen sliders to adjust:
- **Font Size:** Dynamically scales text on the receiver.
- **Brightness:** Controls text dimming for better visibility on glass.

## ⚙️ Model Configuration

- **Tiny / Base:** Recommended for fastest response.
- **Arabic:** Use Multilingual models (e.g., `base` or `small`) for Arabic support.

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
