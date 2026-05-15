import sys
import g4f

# Force UTF-8 encoding for Windows consoles
sys.stdout.reconfigure(encoding='utf-8')

def generate_test_cases(prompt):
    try:
        full_prompt = f"""You are an expert QA Automation Engineer. 
        Generate comprehensive test cases (Positive and Negative) for the following requirement:
        
        "{prompt}"
        
        RETURN ONLY A RAW JSON ARRAY. Do not include any markdown formatting (like ```json), explanations, or intro text.
        The JSON should follow this exact schema:
        [
            {{
                "title": "Short descriptive title (e.g. Verify Login with Valid Credentials)",
                "description": "Detailed description of what is being tested",
                "preconditions": "List of preconditions",
                "steps": "Step 1: Action\\nStep 2: Action",
                "expected_result": "What should happen",
                "priority": "High" (or Medium/Low)
            }}
        ]
        """

        # g4f.debug.logging = True # Enable debug logging if needed
        
        response = g4f.ChatCompletion.create(
            model=g4f.models.default, # Auto-selects best available model
            messages=[{"role": "user", "content": full_prompt}],
            stream=False
        )

        # Handle different response types (string vs object)
        if isinstance(response, str):
            print(response)
        else:
            print(str(response))

    except Exception as e:
        print(f"Error generating test cases with AI: {str(e)}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        user_prompt = sys.argv[1]
        generate_test_cases(user_prompt)
    else:
        print("Please provide a prompt argument.")
