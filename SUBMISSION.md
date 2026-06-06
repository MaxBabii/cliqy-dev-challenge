## Krok 1 — API klasyfikacji i integracja OpenAI

### Kluczowe elementy implementacji:
* **Wymuszenie struktury (Structured Outputs):** Wykorzystałem natywny tryb `response_format: { type: 'json_object' }` modelu `gpt-4o-mini`, co gwarantuje 100% stabilności parsowania danych.
* **Definiowanie granic (Few-Shot / Guardrails):** Początkowo model mylił zapytania przedzakupowe (np. pytania o rabat przy dużych ilościach) z gotowością do zakupu i wrzucał je do kategorii `zamówienie`. Dodałem do promptu systemowego ścisłe reguły i kryteria rozróżniania intencji. Dzięki temu system bezbłędnie separuje zapytania (`pytanie`) od bezpośrednich deklaracji zakupu (`zamówienie`).
* **Walidacja i bezpieczeństwo:** Endpoint zwraca status `400 Bad Request` w przypadku wykrycia pustych ciągów znaków (po usunięciu białych spacji) lub niepoprawnego formatu body JSON. Wartość `confidence` jest matematycznie ograniczona do przedziału `[0.0, 1.0]`.

---

## Krok 2 — Kolejka weryfikacji (Frontend)

Zbudowałem dynamiczny interfejs użytkownika w `src/app/queue/page.tsx`, w pełni realizujący założenia systemu typu Human-in-the-Loop.

### Zrealizowane funkcjonalności:
* **Zarządzanie stanem (Immutable State):** Logika aplikacji opiera się na czystym stanie React (`useState`). Wszystkie operacje modyfikacji (akceptacja, odrzucenie, edycja) realizowane są bez mutowania pierwotnych struktur danych, przy użyciu metody `.map()`.
* **Bezpieczna izolacja edycji inline:** Zaimplementowałem mechanizm edycji draftu z blokadą wycieku stanu. Tekst edytowanego draftu jest zapisywany w dedykowanym buforze, a pozostałe akcje (Zatwierdź/Odrzuć) są ukrywane na czas edycji, co zapobiega błędom operacyjnym (Race Conditions).
* **Filtrowanie i UX:** Panel umożliwia błyskawiczne przełączanie widoków w oparciu o kategorie zgłoszeń, a przetworzone elementy otrzymują obniżoną opozycję (`opacity-50`), ułatwiając operatorowi skupienie się na zadaniach o statusie `pending`.

---

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