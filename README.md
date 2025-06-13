# Landed Cost Estimator

A full-stack application to calculate the total cost of importing products into India, taking into account shipping, customs duties, and other charges.

## Features

- Calculate landed costs for different shipping modes (Sea FCL, Sea LCL, Air Courier, Air Cargo)
- Support for different INCO terms (EXW, FOB, CIF)
- Automatic freight cost lookup from Supabase
- HSN code-based customs duty calculation
- Detailed cost breakdown
- Responsive design with Tailwind CSS

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- React Hook Form + Zod
- Supabase

## Prerequisites

- Node.js 18+ and npm
- Supabase account and project

## Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd landed-cost-estimator
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

4. Set up your Supabase database with the following tables:

   ```sql
   -- freight_costs table
   create table freight_costs (
     id serial primary key,
     country varchar(100),
     origin_port varchar(100),
     destination_port varchar(100),
     container_type varchar(20),
     freight_cost_usd numeric(10,2),
     alternate_routes text
   );

   -- hs_codes table
   create table hs_codes (
     hsn_code varchar(10) primary key,
     description text,
     duty_percentage numeric(5,2)
   );
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Enter the Invoice Value and select the currency
2. Choose the shipping mode (Sea FCL, Sea LCL, Air Courier, or Air Cargo)
3. Select the INCO term
4. Enter the HSN code for customs duty calculation
5. Fill in the origin and destination details
6. Enter the shipment dimensions and weight
7. Click "Calculate Landed Cost" to see the detailed breakdown

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 