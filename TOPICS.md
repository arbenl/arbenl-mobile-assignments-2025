# 🧩 Project Topics (IDs 01–60)

> Medium difficulty, suitable for Flutter / React Native / Kotlin.  
> Suggested Supabase tables are indicated for each topic.

## Productivity & Utilities
01. Task Manager with AI summaries (Supabase: tasks{id, title, is_done, owner_id}) — (Taken by Malsor Hyseni)
   - React Native + Expo Snack: Krijo lista detyrash me komponentë `FlatList`, përdor Supabase REST për CRUD dhe lidhe summarizimin me një endpoint AI të thjeshtë dummy gjatë prototipit.
02. Habit Tracker + Streaks + Reminders (Supabase: habits{id, name, streak, user_id}) — (Taken by Roni Morina)
   - React Native + Expo Snack: Ndërto karta zakonesh me AsyncStorage për cache lokale, vizato streak me `VictoryChart` ose `react-native-svg`, dhe sinkronizo me Supabase.
03. Smart Notes with AI tagging & search (Supabase: notes{id, title, body, tags[], user_id}) — (Available)
   - React Native + Expo Snack: Përdor `TextInput` për shënime, ruaji në Supabase me fusha tags si array dhe imito gjenerimin e etiketave me një funksion lokal deri sa të lidhet shërbimi AI.
04. Personal Finance Tracker with budgets (Supabase: transactions{id, amount, category, user_id}) — (Taken by Gentrit Hyseni)
   - React Native + Expo Snack: Implemento formular me `react-hook-form`, vizualizo shpenzimet me grafikë `VictoryPie` dhe filtro transaksionet duke pyetur Supabase.
05. Pomodoro Timer + Focus Stats (Supabase: sessions{id, start_at, length, user_id}) — (Taken by Festim Bunjaku)
   - React Native + Expo Snack: Shfrytëzo `useEffect` për timers me `setInterval`, ruaj sesionet në Supabase dhe shfaq statistika ditore me tabela dinamike.
06. Document Scanner + OCR + AI summaries (Storage + docs{id, url, summary, user_id}) — (Available)
   - React Native + Expo Snack: Prototipo me `expo-document-picker`, ngarko skedarët në Supabase Storage dhe vendos tekste OCR/AI të simuluara derisa të integrosh shërbime reale.
07. Multi-language Translator Phrasebook (phrases{id, lang_src, lang_dst, text, user_id}) — (Available)
   - React Native + Expo Snack: Ndërto formë për shtim frazash, ruaji në Supabase dhe shfaq listën me filtrime sipas gjuhës; thirrja AI për përkthim mund të zëvendësohet me funksion dummy në Snack.
08. Goal Planner + AI milestone generator (goals{id, title, milestones[], user_id}) — (Available)
   - React Native + Expo Snack: Organizoi qëllimet në `SectionList`, ruaj milestones si array JSON në Supabase dhe jep sugjerime për milestone me një modal që përdor funksion lokal AI.
09. Timezone World Clock + Meeting Helper (meetings{id, title, tz, user_id}) — (Available)
   - React Native + Expo Snack: Konsumo API publike për zona orare, llogarit diferencat me `luxon` dhe ruaj planet e takimeve në Supabase për sinkronizim.
10. Smart Calendar with AI agenda (events{id, title, dt, notes, user_id}) — (Available)
   - React Native + Expo Snack: Përdor komponentë kalendari si `react-native-calendars`, sinkronizo ngjarjet me Supabase dhe gjenero përmbledhje të agjendës me një helper AI të mockuar.

## Health & Wellness
11. Water Intake Tracker + Notifications (hydration{dt, amount, user_id}) — (Available)
   - React Native + Expo Snack: Përdor `expo-notifications` për kujtesa, regjistro gotat e ujit në Supabase dhe shfaq grafikun ditor me `VictoryBar`.
12. Step Counter + Goals + Badges (steps{dt, count, user_id}) — (Taken by Leotrim Haliti)
   - React Native + Expo Snack: Imito numërimin e hapave me të dhëna mock, ruaji në Supabase dhe jep `Animated` badges kur arrihen objektivat.
13. Sleep Log + AI Sleep Hygiene tips (sleep{dt, hours, quality, user_id}) — (Taken by Fiona Sadiku)
   - React Native + Expo Snack: Ndërto formular për orarin e gjumit, vizualizo orët e fjetura me `LineChart` dhe gjenero këshilla përmes një funksioni lokal AI.
14. Mood Journal + Sentiment with AI (moods{dt, note, sentiment, user_id}) — (Available)
   - React Native + Expo Snack: Përdor `DatePicker` dhe `TextInput`, ruaj shënimet në Supabase dhe llogarit sentiment me funksion mock që kategorizon humorin.
15. Simple Workout Planner + History (workouts{id, name, plan[], user_id}) — (Taken by Erion Mustafa)
   - React Native + Expo Snack: Krijo lista ushtrimesh me drag-and-drop (p.sh. `react-native-draggable-flatlist`) dhe sinkronizo planin në Supabase si JSON.
16. Healthy Recipes + AI nutrition facts (recipes{id, title, tags[], user_id}) — (Taken by Donart Selmani)
   - React Native + Expo Snack: Shfaq karta recetash me `Image` dhe `Card`, ruaj të dhënat në Supabase dhe llogarit makronutrientë me një helper të thjeshtë.
17. Medication Reminder + Stock check (meds{id, name, schedule[], user_id}) — (Available)
   - React Native + Expo Snack: Shto medikamente përmes një forme me `DateTimePicker`, planifiko njoftime push dhe ruaj sasitë në Supabase me logjikë të thjeshtë stock-u.
18. Guided Breathing + HR estimate (sessions{id, pattern, user_id}) — (Available)
   - React Native + Expo Snack: Animoni udhëzimet e frymëmarrjes me `Animated API`, regjistro sesionet në Supabase dhe shfaq HR të llogaritur me funksion dummy.
19. Period Tracker + Insights (cycles{dt, note, user_id}) — (Available)
   - React Native + Expo Snack: Shfaq kalendar cikli, ruaj simptomat në Supabase dhe llogarit parashikime me funksione lokale derisa të shtosh AI.
20. Posture Coach (timers + tips) (posture{dt, duration, user_id}) — (Available)
   - React Native + Expo Snack: Përdor timers me `setInterval`, regjistro kohën e qëndrimeve në Supabase dhe shfaq këshilla në modal bazuar në kohën totale.

## Learning & Careers
21. Flashcards with spaced repetition (cards{id, front, back, box, user_id}) — (Available)
   - React Native + Expo Snack: Ndërto `Swipeable` kartat për të praktikuar, ruaj progresin e kutive në Supabase dhe programo rishikimet me një queue lokale.
22. AI Essay Outline Generator (outlines{id, topic, bullets[], user_id}) — (Available)
   - React Native + Expo Snack: Harto formë për temat, ruaj bullets si array në Supabase dhe prodho një outline të shembullt me funksion pseud-AI për prototipim.
23. Interview Prep (Q/A bank + AI hints) (qa{id, question, answer, user_id}) — (Available)
   - React Native + Expo Snack: Përdor `Accordion` për pyetje/përgjigje, ruaj koleksionet në Supabase dhe gjenero këshilla të personalizuara me helper lokal.
24. CV Builder + Skill Gap Advisor (profiles{id, name, skills[], user_id}) — (Taken by Leona Berisha)
   - React Native + Expo Snack: Krijo forma me seksione të editueshme, sinkronizo me Supabase dhe sugjero aftësi të reja përmes krahasimit të listave.
25. Language Learning Drills (lessons{id, prompt, score, user_id}) — (Available)
   - React Native + Expo Snack: Implemento modal për ushtrime audio/tekst, dërgo rezultatet në Supabase dhe jap feedback automatik me funksion AI të simplifikuar.
26. Code Snippet Vault + Explainer AI (snippets{id, code, tags[], user_id}) — (Available)
   - React Native + Expo Snack: Përdor `SyntaxHighlighter` për snippets, ruaj metadatat në Supabase dhe krijo shpjegime automatikisht me helper lokal.
27. Public Speaking Coach (notes{id, script, tips[], user_id}) — (Available)
   - React Native + Expo Snack: Ruaj skriptet si tekst, shfaq countdown për prova dhe gjenero këshilla të personalizuara me funksion të thjeshtë AI.
28. Study Planner + AI weekly plan (plans{id, week, items[], user_id}) — (Taken by Dzemilje Sulejmanovic)
   - React Native + Expo Snack: Organizoi planin me `CalendarList`, sinkronizo në Supabase dhe ofro plane javore të sugjeruara nga një generator JavaScript.
29. Portfolio Tracker (projects{id, title, url, user_id}) — (Available)
   - React Native + Expo Snack: Shfaq projektet si `Card` me buton `Linking.openURL`, ruaj të dhënat në Supabase dhe krijo përmbledhje statistikore me hooks.
30. Quiz Builder + Results (quizzes{id, items[], score, user_id}) — (Available)
   - React Native + Expo Snack: Mundëso krijimin e pyetjeve dinamike, ruaj rezultatet në Supabase dhe shfaq raportet me grafiqe të thjeshta.

## Social & Community
31. Campus Events (map + RSVP) (events{id, title, place, dt, user_id}) — (Available)
   - React Native + Expo Snack: Përdor `expo-location` për hartën, regjistro RSVP në Supabase dhe shfaq eventet me `MapView` plus listën e filtruar.
32. Book Club (reading list + reviews) (books{id, title, note, user_id}) — (Available)
   - React Native + Expo Snack: Shfaq libra në `FlatList`, ruaj review në Supabase dhe shto filtër sipas statusit të leximit.
33. Volunteer Finder + Hours Log (volunteer{id, org, hours, user_id}) — (Available)
   - React Native + Expo Snack: Ndërto listë organizatash nga Supabase, lejo logim orësh me formular dhe vizualizo progresin me një progress bar.
34. Local Marketplace (listings + chat) (listings{id, title, price, seller_id}) — (Available)
   - React Native + Expo Snack: Krijo karta të postimeve, ruaj listimet dhe preferencat në Supabase dhe përdor `gifted-chat` për biseda të thjeshta.
35. Study Buddy Match (profiles{id, major, time, user_id}) — (Available)
   - React Native + Expo Snack: Shfaq profilet si swipe cards, ruaj preferencat në Supabase dhe gjenero ndeshje me një algoritëm bazë në klient.
36. Pet Adoption Browser + Faves (pets{id, name, breed, status, user_id}) — (Taken by Elona Halitaj)
   - React Native + Expo Snack: Shfaq kafshët me `ImageBackground`, ruaj preferencat në Supabase dhe filtro sipas statusit të adoptimit.
37. Sports Pickup Games (create/join) (games{id, sport, place, dt, created_by}) — (Taken by Qefser Karpuzi)
   - React Native + Expo Snack: Përdor forms për krijim ndeshjesh, ruaj pjesëmarrësit në Supabase dhe shfaq ndeshjet në listë kronologjike.
38. Mentorship Matching (mentors{id, skill, slots}, mentees{id, goal}) — (Available)
   - React Native + Expo Snack: Menaxho dy tabela Supabase, shfaq profilet me `SectionList` dhe implemento logjikën e ndeshjes në klien.
39. Time-banking (skills exchange) (offers{id, skill, unit, user_id}) — (Available)
   - React Native + Expo Snack: Lejo përdoruesit të postojnë aftësi, ruaj marrëveshjet në Supabase dhe shfaq bilancin e orëve me përllogaritje lokale.
40. Lost & Found Campus (items{id, desc, pic, status}) — (Available)
   - React Native + Expo Snack: Përdor `expo-image-picker` për foto, ruaj metadata në Supabase dhe filtro sipas statusit Hum-betur/Gjetur.

## Travel & Logistics
41. Bus/Train Schedule + Alerts (routes{id, name}, trips{dt, route_id}) — (Available)
   - React Native + Expo Snack: Marr skedar statik JSON për oraret, sinkronizo ndryshimet në Supabase dhe përdor `Notifications` për paralajmërime nisjeje.
42. Packing List + Weather Hints (items{id, name, qty, trip_id}) — (Available)
   - React Native + Expo Snack: Gjenero listën me `Checkbox` komponentë, ruaj udhëtimet në Supabase dhe thirr API moti për sugjerime (mock në Snack).
43. City Guide + Offline cache (places{id, name, cat, note}) — (Available)
   - React Native + Expo Snack: Shfaq vendet me `SectionList`, ruaj të dhënat në Supabase dhe përdor `expo-file-system` për cache të thjeshtë offline.
44. Expense Splitter for trips (splits{id, amt, who[], trip_id}) — (Available)
   - React Native + Expo Snack: Ndërto tabelë për shpenzimet, ruaj në Supabase dhe përdor funksione JavaScript për të llogaritur balancat midis shokëve.
45. Parking Finder + Favorites (spots{id, address, rating, user_id}) — (Taken by Flokart Pajaziti)
   - React Native + Expo Snack: Shfaq vendparkimet në `MapView`, ruaj preferencat në Supabase dhe lejo filtrime sipas vlerësimit.
46. Fuel Log + Consumption stats (fuel{dt, liters, km, user_id}) — (Available)
   - React Native + Expo Snack: Regjistro furnizimet me formular, ruaj në Supabase dhe llogarit konsumin mesatar me diagramë `LineChart`.
47. Commute Optimizer (history + tips) (commutes{dt, mode, time, user_id}) — (Available)
   - React Native + Expo Snack: Regjistro udhëtimet si log Supabase, vizualizo kohën mesatare dhe sugjero opsione më të mira me logjikë të thjeshtë në klien.
48. Travel Journal + AI captions (photos{id, url, caption}) — (Available)
   - React Native + Expo Snack: Përdor `expo-image-picker` për foto, ruaj URL në Supabase Storage dhe prodho përshkrime me helper AI të simulueshëm.
49. EV Charge Planner (stations + notes) (stations{id, name, kw, fav}) — (Available)
   - React Native + Expo Snack: Shfaq stacionet në hartë, ruaj pikat e preferuara në Supabase dhe llogarit distancat me `geolib`.
50. Bike Route Logger + POIs (rides{dt, km, note, user_id}) — (Available)
   - React Native + Expo Snack: Regjistro gjurmimet si polyline mock, ruaj stat në Supabase dhe shfaq interesat me `Marker` në `MapView`.

## Media & Creativity
51. Podcast Queue + Notes (episodes{id, title, note, user_id}) — (Available)
   - React Native + Expo Snack: Shfaq listën e episodeve me `SwipeListView`, ruaj shënimet në Supabase dhe përdor `Audio` API për streaming test.
52. Photo Journal + AI tags (photos{id, url, tags[], user_id}) — (Available)
   - React Native + Expo Snack: Ngarko foto me `expo-image-picker`, ruaj metadata/tag në Supabase dhe gjenero tags me funksion AI të thjeshtë.
53. Music Practice Log + Tempo (practice{dt, minutes, piece, user_id}) — (Available)
   - React Native + Expo Snack: Regjistro seancat me `DateTimePicker`, ruaj në Supabase dhe simuloni metronomin me `Animated` dhe `setInterval`.
54. Recipe Book + Shopping List (recipes{id, title}, ingredients{id, qty}) — (Available)
   - React Native + Expo Snack: Menaxho receta dhe lista blerjesh në Supabase, shfaq to-do list me `SwipeableRow` për kontroll të përbërësve.
55. Movie Watchlist + Ratings (movies{id, title, rating, user_id}) — (Taken by Enes Jashari)
   - React Native + Expo Snack: Përdor `react-native-ratings` për vlerësime, ruaj filmat në Supabase dhe filtro sipas statusit të shikuar.
56. Reading Tracker + Quotes (reads{id, book, page, quote, user_id}) — (Available)
   - React Native + Expo Snack: Regjistro progresin me `Slider`, ruaj citate në Supabase dhe shfaq statistikë javore me grafik linear.
57. Idea Board + AI brainstorm (ideas{id, note, tags[], user_id}) — (Available)
   - React Native + Expo Snack: Implemento board me `MasonryList`, ruaj idetë në Supabase dhe gjenero sugjerime të reja me funksion AI fallback.
58. Daily Journal + Mood AI (journal{dt, text, mood, user_id}) — (Available)
   - React Native + Expo Snack: Përdor `RichText` komponent opsional, ruaj shënimet në Supabase dhe kalkulo humorin me klasifikues lokal.
59. Design System Tokens (colors, spacing) (tokens{key, value, user_id}) — (Available)
   - React Native + Expo Snack: Shfaq variabla dizajni në lista, lejo editimin dhe ruajtjen në Supabase, duke krijuar eksport JSON për përdorim në projekte.
60. Meme Generator + Templates (memes{id, src, top, bottom, user_id}) — (Available)
   - React Native + Expo Snack: Përdor `expo-image-manipulator` për pozicionimin e tekstit mbi imazh, ruaj postimet në Supabase dhe lejo ndarjen me `Share`.
