import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, Image, StyleSheet, Button } from 'react-native';
import { TextInputMask } from 'react-native-masked-text';
import { QRCodeScannerComponent } from '../../components/CameraComponent';

const UniversalTextField = ({ columnName, label, value, onChange, funcaoChamada, tableName, placeholder }) => {
  const [isValid, setIsValid] = useState(true);
  const [inputDate, setInputDate] = useState('');
  const [showQRCodeScanner, setShowQRCodeScanner] = useState(false);
  const [qrCodeValue, setQRCodeValue] = useState('');

  // CPF
  if (columnName === "cpf") {
    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>{label}</Text>
        <TextInputMask
          type="cpf"
          value={value}
          onChangeText={(text) => {
            onChange(text);
            funcaoChamada?.[columnName]?.(tableName, columnName, text);
          }}
          style={styles.input}
          placeholder={label}
        />
      </View>
    );
  }
  // Horário
  if (columnName === "horario") {
    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>{label}</Text>
        <TextInputMask
          type="custom"
          options={{ mask: "99:99" }}
          value={value}
          onChangeText={(text) => {
            onChange(text);
            funcaoChamada?.[columnName]?.(tableName, columnName, text);
          }}
          style={styles.input}
          placeholder={label}
        />
      </View>
    );
  }
  // Email
  if (columnName.includes("email")) {
    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
          value={value}
          onChangeText={(text) => {
            onChange(text);
            setIsValid(text.includes("@"));
            funcaoChamada?.[columnName]?.(tableName, columnName, text);
          }}
          style={[styles.input, !isValid && styles.errorInput]}
          placeholder={label}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        {!isValid && (
          <View style={styles.tooltipContainer}>
            <Text style={styles.tooltipText}>Insira um e-mail válido</Text>
          </View>
        )}
      </View>
    );
  }
  // RG
  if (columnName === "rg") {
    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>{label}</Text>
        <TextInputMask
          type="custom"
          options={{ mask: "99.999.999" }}
          value={value}
          onChangeText={(text) => {
            onChange(text);
            funcaoChamada?.[columnName]?.(tableName, columnName, text);
          }}
          style={styles.input}
          placeholder={label}
        />
      </View>
    );
  }
  // CNPJ
  if (columnName.toLowerCase().startsWith("cnpj")) {
    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>{label}</Text>
        <TextInputMask
          type="custom"
          options={{ mask: "99.999.999/9999-99" }}
          value={value}
          onChangeText={(text) => {
            onChange(text);
            funcaoChamada?.[columnName]?.(tableName, columnName, text);
          }}
          style={styles.input}
          placeholder={label}
        />
      </View>
    );
  }
  // Exibi (apenas exibição)
  if (columnName.startsWith("exibi")) {
    if (!value) return null;
    return (
      <View style={styles.exibiContainer}>
        <Text style={styles.exibiText}>{value}</Text>
      </View>
    );
  }
  // Data
  if (columnName.startsWith("data")) {
    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.row}>
          <TextInputMask
            type="datetime"
            options={{ format: "YYYY/MM/DD" }}
            value={inputDate || value}
            onChangeText={(text) => {
              setInputDate(text);
              // Quando campo for preenchido corretamente, propaga
              const regex = /^\d{4}\/\d{2}\/\d{2}$/;
              if (regex.test(text)) {
                onChange(text);
                funcaoChamada?.[columnName]?.(tableName, columnName, text);
              }
            }}
            style={[styles.input, { flex: 1 }]}
            placeholder={label}
          />
          <TouchableOpacity style={styles.calendarButton} onPress={() => {/* Lógica para abrir picker */}}>
            <Text style={styles.calendarButtonText}>📅</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  // Telefone
  if (columnName === "telefone") {
    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>{label}</Text>
        <TextInputMask
          type="custom"
          options={{ mask: "(99) 99999-9999" }}
          value={value}
          onChangeText={(text) => {
            onChange(text);
            funcaoChamada?.[columnName]?.(tableName, columnName, text);
          }}
          style={styles.input}
          placeholder={label}
        />
      </View>
    );
  }
  // Valor ou Preço (ex.: 'valor' ou 'preco' nos primeiros 5 caracteres)
  if ((columnName.slice(0,5).toLowerCase() === "valor") || (columnName.slice(0,5).toLowerCase() === "preco")) {
    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>{label}</Text>
        <TextInputMask
          type="money"
          options={{
            precision: 2,
            separator: ',',
            delimiter: '.',
            unit: 'R$',
            suffixUnit: ''
          }}
          value={value}
          onChangeText={(text) => {
            onChange(text);
            funcaoChamada?.[columnName]?.(tableName, columnName, text);
          }}
          style={styles.input}
          placeholder={label}
        />
      </View>
    );
  }
  // Ano (caso seja apenas 4 dígitos)
  if (columnName.toLowerCase().startsWith("ano")) {
    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>{label}</Text>
        <TextInputMask
          type="custom"
          options={{ mask: "9999" }}
          value={value}
          onChangeText={(text) => {
            onChange(text);
            funcaoChamada?.[columnName]?.(tableName, columnName, text);
          }}
          style={styles.input}
          placeholder={label}
        />
      </View>
    );
  }
  // QRCode (ex: se a coluna iniciar com "qrcode")
  if (columnName.toLowerCase().startsWith("qrcode")) {
    const handleCheckin = async (scannedValue) => {
      setQRCodeValue(scannedValue);
      onChange(scannedValue);
      funcaoChamada?.[columnName]?.(tableName, columnName, scannedValue);
      setShowQRCodeScanner(false);
    };
    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>{label}</Text>
        { !qrCodeValue ? (
          <TouchableOpacity style={styles.scanButton} onPress={() => setShowQRCodeScanner(true)}>
            <Text style={styles.scanButtonText}>Escanear QR Code</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.qrCodeValueContainer}>
            <Text style={styles.qrCodeValueLabel}>Valor do QR Code:</Text>
            <Text style={styles.qrCodeValue}>{qrCodeValue}</Text>
          </View>
        )}
        <Modal
          visible={showQRCodeScanner}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowQRCodeScanner(false)}
        >
          <View style={styles.modalContainer}>
            <Text style={styles.scannerOverlayText}>Leia o QR Code!</Text>
            <QRCodeScannerComponent onQRCodeScanned={handleCheckin} />
            <Button title="Fechar" onPress={() => setShowQRCodeScanner(false)} />
          </View>
        </Modal>
      </View>
    );
  }
  // Caso default (texto)
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder || label}
        value={value}
        onChangeText={(text) => {
          onChange(text);
          funcaoChamada?.[columnName]?.(tableName, columnName, text);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  fieldContainer: { marginBottom: 10 },
  label: { fontSize: 16, marginBottom: 5, fontWeight: '600', color: '#333' },
  input: { width: '100%', height: 40, borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, fontSize: 14 },
  errorInput: { borderColor: 'red' },
  tooltipContainer: { marginTop: 5, padding: 10, backgroundColor: '#f8d7da', borderRadius: 5, borderWidth: 1, borderColor: '#f5c6cb', flexDirection: 'row', alignItems: 'center' },
  tooltipText: { color: '#721c24', fontSize: 12 },
  exibiContainer: { padding: 10, backgroundColor: '#f5f5f5', borderRadius: 5, borderWidth: 1, borderColor: '#ddd', marginVertical: 5 },
  exibiText: { fontSize: 16, color: '#333', fontWeight: 'bold' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  calendarButton: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 5, borderWidth: 1, borderColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' },
  calendarButtonText: { fontSize: 18, color: '#555' },
  scanButton: { backgroundColor: '#007bff', padding: 10, borderRadius: 5, alignItems: 'center', margin: 10 },
  scanButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  qrCodeValueContainer: { margin: 10, padding: 10, backgroundColor: '#f9f9f9', borderRadius: 5, borderWidth: 1, borderColor: 'gray' },
  qrCodeValueLabel: { fontSize: 16, fontWeight: 'bold' },
  qrCodeValue: { fontSize: 16, marginTop: 5 },
  modalContainer: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  scannerOverlayText: { position: 'absolute', top: 20, left: 0, right: 0, textAlign: 'center', fontSize: 20, fontWeight: 'bold', color: '#fff', zIndex: 10, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2, backgroundColor: 'rgba(0,0,0,0.8)', paddingVertical: 5, borderRadius: 8 }
});

export default UniversalTextField;