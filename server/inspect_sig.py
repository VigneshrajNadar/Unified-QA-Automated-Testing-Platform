from ollamafreeapi import OllamaFreeAPI
import inspect

try:
    print(f"Signature: {inspect.signature(OllamaFreeAPI.chat)}")
except Exception as e:
    print(e)
