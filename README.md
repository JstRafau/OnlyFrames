# OnlyFrames 🎬

**OnlyFrames** to nowoczesna, skalowalna platforma streamingowa służąca do przechowywania, transkodowania i odtwarzania materiałów wideo. Projekt łączy możliwości przetwarzania multimediów z prostotą wdrażania dzięki ekosystemowi .NET Aspire i Dockerowi.

OnlyFrames znajdziesz [tutaj](https://szachuz.lol/).

---

## Główne funkcjonalności

* **Zarządzanie widocznością:** Pełne wsparcie dla filmów **publicznych** oraz **prywatnych** (z ograniczonym dostępem).
* **Bezpieczeństwo i autentykacja:** Pełny system rejestracji, logowania oraz zarządzania uprawnieniami użytkowników, gwarantujący, że prywatne materiały trafiają tylko do uprawnionych osób.
* **Adaptacyjny streaming (HLS):** Wykorzystanie protokołu *HTTP Live Streaming* (HLS), który automatycznie dostosowuje jakość strumienia wideo do przepustowości łącza użytkownika.
* **Wielojakościowość:** Automatyczenie transkodowanie plików wideo do różnych rozdzielczości i gęstości bitowej.
* **Obsługa napisów:** Możliwość dodawania i wyświetlania napisów dla materiałów wideo w różnych językach.
* **Nowoczesny stack i orkiestracja:** Pełna integracja z .NET Aspire, zapewniająca łatwe zarządzanie zależnościami, logami, telemetrią oraz kontenerami.
* **Błyskawiczne wdrożenie:** Całość środowiska developersko-produkcyjnego wstaje automatycznie za pomocą jednej komendy.

---

## Stack technologiczny & Architektura  

* **Framework główny:** .NET (C#) wraz z ekosystemem i orkiestracją **.NET Aspire**.
* **Autentykacja i autoryzacja:** **ASP.NET Core Identity** – wbudowany, bezpieczny system zarządzania użytkownikami, hasłami, rolami oraz tokenami dostępowymi.
* **Przetwarzanie wideo:** **FFmpeg** – serce systemu odpowiedzialne za przetwarzanie, transkodowanie materiałów źródłowych, generowanie wielu wersji jakościowych oraz podział na segmenty `.ts`.
* **Protokół streamingu:** **HLS (HTTP Live Streaming)** – zapewniający płynne i nowoczesne odtwarzanie adaptacyjne w przeglądarce.
* **Warstwa danych (Persistence):** **Entity Framework Core (EF Core)** – wykorzystywany jako zaawansowany ORM do obsługi bazy danych, przechowywania danych strukturalnych ASP.NET Identity, metadanych filmów oraz plików napisów.
* **Konteneryzacja:** **Docker** – gwarantujący pełną powtarzalność środowiska i izolację uruchomionych usług.

---

## Wymagania wstępne

Zanim przejdziesz do wdrożenia, upewnij się, że masz zainstalowane:

* [.NET SDK](https://dotnet.microsoft.com/en-us/download/dotnet/10.0) (wersja 10.0 lub nowsza)
* [Docker Desktop](https://www.docker.com/products/docker-desktop/)

---

## ⚙️ Szybki start i wdrożenie (`aspire deploy`)

Projekt w pełni wykorzystuje CLI .NET Aspire, które automatycznie konfiguruje i podnosi całe środowisko mikroserwisów i baz danych w Dockerze. Nie musisz ręcznie pisać ani utrzymywać skomplikowanych plików `docker-compose.yml`.

#### By postawić serwis lokalnie: 

1. **Sklonuj repozytorium:**
   ```bash
   git clone [https://github.com/JstRafau/OnlyFrames.git](https://github.com/JstRafau/OnlyFrames.git)
   cd OnlyFrames

2. **Zainstaluj CLI .NET Aspire:**

   ```bash
   irm https://aspire.dev/install.ps1 | iex
   dotnet tool install -g Aspire.Cli
   ```

3. **Wdrożenie:**
   ```bash
   aspire deploy