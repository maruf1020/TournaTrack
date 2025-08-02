# ELX-TournaTrack: Annual Tour Sports Tournament Management

Welcome to **ELX-TournaTrack**, a comprehensive, modern web application designed to streamline the process of managing sports tournaments. Built with a powerful stack including Next.js, Firebase, and Genkit for AI-powered features, this platform provides an intuitive and efficient solution for tournament organizers.

## Key Features

- **Dynamic Dashboard**: Get a real-time overview of all tournament activities, including total players, matches played, ongoing matches, and a summary of upcoming and recent results.
- **Automated Tournament Generation**: Easily create full tournament brackets by selecting branches, a game, and the number of players. The system automatically handles seeding and round creation for single-elimination formats.
- **AI Matchup Suggestor**: Leverage the power of Google's Gemini AI to suggest interesting and balanced matchups. The AI considers player history, skill levels, and potential rivalries to propose compelling matches.
- **Live Score Tracking**: A dedicated "Live Scores" page shows all currently ongoing matches, providing real-time updates to participants and spectators.
- **Interactive Tournament Tree**: Visualize the entire tournament bracket in a clean, interactive tree structure. See how rounds connect and track player progression towards the final.
- **Comprehensive Admin Panel**: A secure, role-based admin area provides full control over the tournament:
  - **Employee Management**: Add, edit, remove, and import employee data directly into Firestore.
  - **Match Management**: View and filter all matches, update scores, set winners, and manually advance players.
  - **Settings Control**: Customize application behavior, such as toggling the visibility of certain match statuses for the public or enabling advanced features like bracket editing.
  - **Data Backup & Restore**: Perform full database exports and imports for data security and migration.
- **Responsive & Modern UI**: Built with ShadCN UI components and Tailwind CSS, the interface is clean, responsive, and works beautifully across all devices. It supports both light and dark modes.

## Tech Stack

- **Framework**: Next.js (with App Router)
- **Backend & Database**: Firebase (Firestore, Authentication)
- **AI Integration**: Google AI with Genkit
- **UI Components**: ShadCN UI
- **Styling**: Tailwind CSS
- **Deployment**: Firebase App Hosting

This project serves as a robust foundation for any tournament management needs, combining a user-friendly interface with powerful backend services and cutting-edge AI capabilities.