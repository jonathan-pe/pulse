# Pulse - Prediction-Based Sports App

Pulse is a prediction-based sports app with a gamified approach, steering clear of gambling elements. It utilizes React (Next.js), Tailwind CSS for styling, and TypeScript. The app leverages OddsBlaze for sports odds API and Supabase for API, authentication, and Postgres DB management. Some components are grabbed from shadcn.

## Getting Started

### Prerequisites

Ensure you have the following installed:

- Node.js
- Yarn (preferred package manager)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/pulse.git
   cd pulse
   ```

2. Install dependencies:

   ```bash
   yarn install
   ```

3. Set up environment variables:
   Create a copy of the `.env.example` file in the root directory and fill in the corresponding variables:
   ```env
   cp .env.example .env
   ```

### Running the Development Server

Start the development server:

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

### Building for Production

To create an optimized production build:

```bash
yarn build
```

### Running the Production Build

After building the application, you can start the production server:

```bash
yarn start
```

## Learn More

To learn more about the technologies used in this project, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Tailwind CSS Documentation](https://tailwindcss.com/docs) - learn about Tailwind CSS.
- [Supabase Documentation](https://supabase.com/docs) - learn about Supabase features and API.
- [OddsBlaze API](https://docs.oddsblaze.com/) - learn about the sports odds API.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
