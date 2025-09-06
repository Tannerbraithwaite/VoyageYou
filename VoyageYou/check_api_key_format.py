#!/usr/bin/env python3
"""
Check API key format
"""
import os

def check_api_key_format():
    api_key = 'nvruow54^@VTewnfu58ewsF$*@WVtdG5ewnsjvfinu4i'
    
    print("🔍 API Key Format Check")
    print("=" * 30)
    print(f"Your API Key: {api_key}")
    print(f"Length: {len(api_key)} characters")
    print(f"Starts with 'SG.': {'✅ Yes' if api_key.startswith('SG.') else '❌ No'}")
    
    print("\n📋 Expected SendGrid API Key Format:")
    print("✅ Should start with: SG.")
    print("✅ Should be ~69 characters long")
    print("✅ Should look like: SG.xxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")
    
    print(f"\n🔧 Your key appears to be: {'✅ Valid format' if api_key.startswith('SG.') and len(api_key) > 60 else '❌ Invalid format'}")
    
    if not api_key.startswith('SG.'):
        print("\n⚠️  This doesn't look like a SendGrid API key!")
        print("Please check your SendGrid dashboard and create a new API key.")

if __name__ == "__main__":
    check_api_key_format()
