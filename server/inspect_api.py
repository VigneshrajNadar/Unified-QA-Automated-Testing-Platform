from ollamafreeapi import OllamaFreeAPI
import inspect

try:
    print("Class methods:")
    print(dir(OllamaFreeAPI))
    print("\nChat method help:")
    help(OllamaFreeAPI.chat)
except Exception as e:
    print(e)
