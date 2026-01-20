#include <WiFi.h>          // CORRECT library for ESP32
#include <HTTPClient.h>    // CORRECT library for ESP32

// --- 1. WIFI SETTINGS ---
const char* ssid = "yes";         // <--- CHANGE THIS
const char* password = "00000000"; // <--- CHANGE THIS

// --- 2. SERVER CONNECTION ---
// Replace 192.168.1.XX with your Laptop's IP Address
// We use Port 3000 because that is where our 'energymeter' server listens
const char* serverUrl = "http://10.113.226.130:3000/api/data"; 

// --- 3. PIN DEFINITIONS ---
const int currentPin = 34; // ACS712 Output -> GPIO 34
const int voltagePin = 35; // ZMPT101B Output -> GPIO 35

// --- 4. CALIBRATION (Auto-Adjusting) ---
float vMultiplier = 1.8; // Adjust if Voltage is wrong
float cMultiplier = 1.0; // Adjust if Current is wrong

// --- HELPER DECLARATIONS ---
float readVoltage();
float readCurrent();

void setup() {
  Serial.begin(115200);

  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.println("Connecting to WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  // Check connection
  if(WiFi.status() == WL_CONNECTED){
    HTTPClient http;

    // --- READ REAL SENSORS ---
    float voltage = readVoltage();
    float current = readCurrent();
    float power = voltage * current;

    // Prepare JSON payload
    String jsonPayload = "{\"voltage\":" + String(voltage) + 
                         ", \"current\":" + String(current) + 
                         ", \"power\":" + String(power) + "}";

    // Send POST request
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    
    int httpResponseCode = http.POST(jsonPayload);
    
    // Debugging output
    Serial.print("Sent: ");
    Serial.print(jsonPayload);
    Serial.print(" | Response: ");
    Serial.println(httpResponseCode); // Should be 200
      
    http.end();
  }
  else {
    Serial.println("WiFi Disconnected");
  }

  delay(1000); // Send data every 1 second
}

// --- HELPER: READ VOLTAGE (RMS) ---
float readVoltage() {
  float sum = 0;
  float sumSq = 0;
  int count = 0;
  unsigned long start = millis();
  
  while (millis() - start < 100) { // Sample for 100ms
    int val = analogRead(voltagePin);
    sum += val;
    sumSq += (val * val);
    count++;
  }
  
  float mean = sum / count;
  float variance = (sumSq / count) - (mean * mean);
  if (variance < 0) variance = 0;
  
  float rmsADC = sqrt(variance);
  float volts = rmsADC * 0.2 * vMultiplier; 
  
  if (volts < 5) volts = 0; // Filter noise
  return volts;
}

// --- HELPER: READ CURRENT (RMS) ---
float readCurrent() {
  int maxVal = 0;
  int minVal = 4095;
  unsigned long start = millis();

  while (millis() - start < 100) { // Sample for 100ms
    int val = analogRead(currentPin);
    if (val > maxVal) maxVal = val;
    if (val < minVal) minVal = val;
  }

  float peakPeak = maxVal - minVal;
  float voltage = (peakPeak * 3.3) / 4095.0;
  float amps = (voltage * 0.3535 * 1000) / 185; // For 5A Module
  
  amps = amps * cMultiplier;
  if (amps < 0.10) amps = 0; // Filter noise
  return amps;
}
