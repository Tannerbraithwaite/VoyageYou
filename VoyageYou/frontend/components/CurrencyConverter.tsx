import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import GlassCard from './ui/GlassCard';

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  rate: number; // Exchange rate relative to USD
}

interface CurrencyConverterProps {
  selectedCurrency: Currency;
  onCurrencyChange: (currency: Currency) => void;
  showSelector?: boolean;
}

const AVAILABLE_CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1.0 },
  { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.85 },
  { code: 'GBP', name: 'British Pound', symbol: '£', rate: 0.73 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', rate: 110.0 },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', rate: 1.25 },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', rate: 1.35 },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', rate: 0.92 },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', rate: 6.45 },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', rate: 74.5 },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', rate: 5.2 },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$', rate: 20.0 },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', rate: 1100.0 },
];

export const CurrencyConverter: React.FC<CurrencyConverterProps> = ({
  selectedCurrency,
  onCurrencyChange,
  showSelector = false,
}) => {
  const [showModal, setShowModal] = useState(false);

  const convertPrice = (usdPrice: number): number => {
    return usdPrice * selectedCurrency.rate;
  };

  const formatPrice = (usdPrice: number): string => {
    const convertedPrice = convertPrice(usdPrice);
    
    // Format based on currency
    switch (selectedCurrency.code) {
      case 'JPY':
      case 'KRW':
        return `${selectedCurrency.symbol}${Math.round(convertedPrice).toLocaleString()}`;
      case 'INR':
        return `${selectedCurrency.symbol}${Math.round(convertedPrice).toLocaleString()}`;
      default:
        return `${selectedCurrency.symbol}${convertedPrice.toFixed(2)}`;
    }
  };

  const handleCurrencySelect = (currency: Currency) => {
    onCurrencyChange(currency);
    setShowModal(false);
  };

  return (
    <>
      <TouchableOpacity 
        style={styles.currencySelector}
        onPress={() => setShowModal(true)}
      >
        <Text style={styles.currencyText}>
          {selectedCurrency.code} {selectedCurrency.symbol}
        </Text>
        <Text style={styles.changeText}>Change</Text>
      </TouchableOpacity>

      <Modal visible={showModal} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Currency</Text>
            <Text style={styles.modalSubtitle}>
              Prices will be converted from USD to your selected currency
            </Text>
            
            <ScrollView style={styles.currencyList}>
              {AVAILABLE_CURRENCIES.map((currency) => (
                <TouchableOpacity
                  key={currency.code}
                  style={[
                    styles.currencyItem,
                    selectedCurrency.code === currency.code && styles.currencyItemSelected
                  ]}
                  onPress={() => handleCurrencySelect(currency)}
                >
                  <View style={styles.currencyInfo}>
                    <Text style={styles.currencyCode}>{currency.code}</Text>
                    <Text style={styles.currencyName}>{currency.name}</Text>
                  </View>
                  <View style={styles.currencyRate}>
                    <Text style={styles.rateText}>
                      {currency.symbol}1 = ${(1 / currency.rate).toFixed(4)}
                    </Text>
                    <Text style={styles.rateText}>
                      $1 = {currency.symbol}{currency.rate.toFixed(4)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </GlassCard>
        </View>
      </Modal>
    </>
  );
};

// Export the utility functions for use in other components
export const useCurrencyConverter = (selectedCurrency: Currency) => {
  const convertPrice = (usdPrice: number): number => {
    return usdPrice * selectedCurrency.rate;
  };

  const formatPrice = (usdPrice: number): string => {
    const convertedPrice = convertPrice(usdPrice);
    
    switch (selectedCurrency.code) {
      case 'JPY':
      case 'KRW':
        return `${selectedCurrency.symbol}${Math.round(convertedPrice).toLocaleString()}`;
      case 'INR':
        return `${selectedCurrency.symbol}${Math.round(convertedPrice).toLocaleString()}`;
      default:
        return `${selectedCurrency.symbol}${convertedPrice.toFixed(2)}`;
    }
  };

  return { convertPrice, formatPrice };
};

const styles = StyleSheet.create({
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 15,
  },
  currencyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  changeText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    padding: 24,
    margin: 24,
    minWidth: 300,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#cccccc',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  currencyList: {
    maxHeight: 400,
  },
  currencyItem: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  currencyItemSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#3a3a3a',
  },
  currencyInfo: {
    marginBottom: 8,
  },
  currencyCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  currencyName: {
    fontSize: 14,
    color: '#cccccc',
  },
  currencyRate: {
    alignItems: 'flex-end',
  },
  rateText: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 2,
  },
  cancelButton: {
    backgroundColor: '#6b7280',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
