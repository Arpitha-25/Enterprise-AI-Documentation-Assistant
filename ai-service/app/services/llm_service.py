from groq import Groq
from app.core.config import settings

GROQ_API_KEY = settings.GROQ_API_KEY
class LLMService:

    client = Groq(api_key=settings.GROQ_API_KEY)

    @classmethod
    def generate_answer(cls, question, context):

        prompt = f"""
You are a Network Documentation Assistant.

Answer ONLY using the documentation provided below.

If the answer is not present, reply:

"I couldn't find that information in the uploaded documentation."

Documentation:
{context}

Question:
{question}

Answer:
"""

        response = cls.client.chat.completions.create(

            model=settings.MODEL_NAME,

            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],

            temperature=0.2
        )

        return response.choices[0].message.content