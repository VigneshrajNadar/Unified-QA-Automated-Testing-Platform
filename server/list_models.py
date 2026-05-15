from ollamafreeapi import OllamaFreeAPI

try:
    client = OllamaFreeAPI()
    models = client.list_models()
    print("Available models:")
    for model in models:
        print(model)
except Exception as e:
    print(f"Error listing models: {e}")
