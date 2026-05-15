import g4f

print("Listing g4f.models attributes:")
try:
    for attr in dir(g4f.models):
        if not attr.startswith("__"):
            print(attr)
except Exception as e:
    print(f"Error: {e}")

print("\nTrying to import specific models:")
try:
    print(f"gpt_35_turbo: {g4f.models.gpt_35_turbo}")
    print(f"gpt_4: {g4f.models.gpt_4}")
    print(f"default: {g4f.models.default}")
except AttributeError as e:
    print(f"Attribute Error: {e}")
