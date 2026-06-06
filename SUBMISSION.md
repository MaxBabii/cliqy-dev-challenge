## Krok 3 — Funkcja autorska (Symulator wiadomości przychodzących + Licznik)

Jako funkcję dodatkową wdrożyłem **Interaktywny Symulator Wiadomości Przychodzących zintegrowany z licznikiem statystyk w czasie rzeczywistym**.

### Dlaczego?
Zamiast opierać się wyłącznie na statycznych danych testowych (`SEED_ITEMS`), oddany panel pozwala na zasymulowanie realnego flow biznesowego. Użytkownik może wpisać dowolną nazwę firmy oraz treść zapytania. System wysyła żądanie do API, a model AI w locie dokonuje automatycznej klasyfikacji i generuje unikalną odpowiedź, która natychmiast trafia na szczyt kolejki operatora. Ponadto zaktualizowany licznik u góry ekranu pozwala na bieżąco monitorować efektywność pracy i obciążenie systemu.

---

## 🛠️ AI — Jak używałem narzędzi

* **Narzędzia:** ChatGPT, Cursor, Gemini
* **Prompt, który zadziałał najlepiej:** 
  > *"Działasz jako endpoint klasyfikacji w systemie Customer Support. Przeanalizuj intencję wiadomości. Jeśli klient pyta o ceny, dostępność lub warunki rabatowe, ale nie podaje danych do dostawy i nie deklaruje zakupu tu i teraz – zaklasyfikuj to jako 'pytanie', a nie 'zamówienie'. Zwróć ścisły JSON."*
* **Gdzie AI popełniło błąd i co poprawiłem ręcznie:**
  1. **Klasyfikacja intencji:** AI początkowo zbyt powierzchownie interpretowało język polski, myląc zapytania ofertowe z zamówieniami. Musiałem ręcznie zmodyfikować prompt systemowy na backendzie, wprowadzając negatywne i pozytywne definicje granic dla modelu.
  2. **Architektura stanu:** AI miało tendencję do współdzielenia jednego stanu `textarea` dla wszystkich elementów kolejki. Poprawiłem to poprzez powiązanie bufora tekstowego z unikalnym `editingId`.
* **Szacowany udział AI w kodzie:** 60% wygenerowane przez AI (szablony Tailwind, boilerplate integracji OpenAI), 40% napisane i zdebugowane ręcznie (architektura stanu React, precyzyjny prompt engineering, walidacja typów TypeScript).