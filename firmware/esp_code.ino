#include <WiFi.h>          
#include <HTTPClient.h>    

const char* ssid = "yes";         
const char* password = "00000000"; 

const char* serverUrl = "http://10.113.226.130:3000/api/data"; 

const int currentPin = 34; 
const int voltagePin = 35; 

float vMultiplier = 1.8; 
float cMultiplier = 1.0; 

float readVoltage();
float readCurrent();

void setup() {
  Serial.begin(115200);

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

  if(WiFi.status() == WL_CONNECTED){
    HTTPClient http;

    float voltage = readVoltage();
    float current = readCurrent();
    float power = voltage * current;

    String jsonPayload = "{\"voltage\":" + String(voltage) + 
                         ", \"current\":" + String(current) + 
                         ", \"power\":" + String(power) + "}";

    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    int httpResponseCode = http.POST(jsonPayload);

    Serial.print("Sent: ");
    Serial.print(jsonPayload);
    Serial.print(" | Response: ");
    Serial.println(httpResponseCode); 

    http.end();
  }
  else {
    Serial.println("WiFi Disconnected");
  }

  delay(1000); 
}

float readVoltage() {
  float sum = 0;
  float sumSq = 0;
  int count = 0;
  unsigned long start = millis();

  while (millis() - start < 100) { 
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

  if (volts < 5) volts = 0; 
  return volts;
}

float readCurrent() {
  int maxVal = 0;
  int minVal = 4095;
  unsigned long start = millis();

  while (millis() - start < 100) { 
    int val = analogRead(currentPin);
    if (val > maxVal) maxVal = val;
    if (val < minVal) minVal = val;
  }

  float peakPeak = maxVal - minVal;
  float voltage = (peakPeak * 3.3) / 4095.0;
  float amps = (voltage * 0.3535 * 1000) / 185; 

  amps = amps * cMultiplier;
  if (amps < 0.10) amps = 0; 
  return amps;
}
