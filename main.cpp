#include <SD.h>

const int chipSelect = BUILTIN_SDCARD;

void setup() {
    Serial.begin(115200);
    while (!Serial) {} // wait for USB serial connection

    if (!SD.begin(chipSelect)) {
        Serial.println("ERROR: SD card init failed");
        return;
    }
    Serial.println("READY");
}

void loop() {
    if (Serial.available()) {
        String cmd = Serial.readStringUntil('\n');
        cmd.trim();

        if (cmd == "LIST") {
            File root = SD.open("/");
            while (true) {
                File entry = root.openNextFile();
                if (!entry) break;
                if (!entry.isDirectory()) {
                    Serial.print(entry.name());
                    Serial.print(",");
                    Serial.println(entry.size());
                }
                entry.close();
            }
            root.close();
            Serial.println("END_LIST");
        }
        else if (cmd.startsWith("GET ")) {
            String fname = cmd.substring(4);
            File f = SD.open(fname.c_str());
            if (f) {
                Serial.println("BEGIN_FILE");
                while (f.available()) {
                    Serial.write(f.read());
                }
                Serial.println("\nEND_FILE");
                f.close();
            } else {
                Serial.println("ERROR: File not found");
            }
        }
    }
}