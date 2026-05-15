from ollamafreeapi import OllamaFreeAPI

client = OllamaFreeAPI()
models_to_try = ["qwen2.5:0.5b", "gemma:2b", "phi3", "llama3.2:1b", "tinyllama"]

print("Testing models for availability...")

for model in models_to_try:
    print(f"\n--- Testing result for {model} ---")
    try:
        response = client.chat(
            prompt="Hi, are you working?",
            model=model
        )
        print(f"SUCCESS with {model}: {response}")
        break 
    except Exception as e:
        print(f"FAILED {model}: {e}")
