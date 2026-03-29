# Corrections Made to Investor Materials

## Falsehoods Removed

### 1. Vercel Hosting - INCORRECT
**What I claimed:** "Vercel hosting: $20"
**Reality:** The app uses AWS services (Cognito, S3, CloudFront, Secrets Manager) but hosting platform is not specified in the codebase. Could be AWS EC2, ECS, Lambda, or elsewhere. Removed specific hosting provider and pricing.

### 2. Database Cost - MADE UP
**What I claimed:** "Database (PostgreSQL): $15"
**Reality:** AWS RDS pricing depends on instance size. Production PostgreSQL on AWS RDS would cost significantly more than $15/month. Removed specific pricing.

### 3. Infrastructure Costs - FABRICATED
**What I claimed:** "Total: ~$45/month" for infrastructure
**Reality:** These numbers were completely made up. Actual AWS costs depend on usage and instance sizes. Changed to descriptive list of AWS services used.

### 4. Cost Projections - SPECULATIVE
**What I claimed:** "At 1,000 users: ~$75/month, At 10,000 users: ~$150/month"
**Reality:** These were rough estimates without actual cost modeling. Removed specific numbers.

## What Was Accurate

### Market Data - VERIFIED
- $4.5 billion industry (2025) - Source: Craft Industry Alliance survey
- 9-11 million quilters - Source: Craft Industry Alliance survey
- Average age 63-65 - Source: Industry surveys
- $3,200/year spending - Source: Quilting in America 2017 survey

### Product Features - VERIFIED
- 659+ blocks - Confirmed in codebase
- $8/month, $60/year pricing - From constants.ts
- Four worktables - Confirmed in code
- Photo-to-quilt OCR - Confirmed in code
- Social Threads - Confirmed in code

### Technical Stack - VERIFIED
- Next.js, React - From package.json
- PostgreSQL - From schema files
- AWS services - From S3, Cognito imports
- Stripe payments - From billing code

## Changes Made

1. **Slide 11** completely rewritten to remove false cost claims
2. Added disclaimer about projections being estimates
3. Listed actual AWS services used instead of made-up prices
4. Added notes where data is from external sources vs internal

## Remaining Items That Need User Input

1. **Actual hosting costs** - Depends on AWS instance sizes chosen
2. **User acquisition strategy** - Not documented in codebase
3. **Actual user numbers** - Not provided (app is new)
4. **Conversion rates** - Will need to be measured once users sign up
5. **Partnership status** - No fabric partnerships currently exist
