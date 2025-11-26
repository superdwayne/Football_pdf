# Airtable REST API Setup Guide

This guide will help you set up the Airtable REST API integration for the Football Player PDF Generator.

## Step 1: Get Your Airtable API Key

1. **Go to Airtable Account Settings**
   - Visit: https://airtable.com/account
   - Or go directly to: https://airtable.com/create/tokens

2. **Create a New Token**
   - Click "Create new token"
   - Give it a descriptive name: `Football Player PDF Generator`

3. **Set Token Scopes**
   - **Data**: Select `data.records:read` (to read player records)
   - **Schema**: Select `schema.bases:read` (to read base structure)
   - These are the minimum permissions needed

4. **Select Base Access**
   - Select the base: `tagged_images.csv` (or the name of your base)
   - Make sure the base contains the "Football Players" table

5. **Create and Copy Token**
   - Click "Create token"
   - **IMPORTANT**: Copy the token immediately - you won't be able to see it again!
   - It will look like: `patXXXXXXXXXXXXXX.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`

## Step 2: Add API Key to Your Project

1. **Create `.env.local` file** (if it doesn't exist)
   ```bash
   touch .env.local
   ```

2. **Add your API key**
   ```env
   AIRTABLE_API_KEY=patXXXXXXXXXXXXXX.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```

3. **Verify the file is in `.gitignore`**
   - Make sure `.env.local` is in your `.gitignore` file
   - Never commit your API key to version control!

## Step 3: Verify Your Base Configuration

The application is already configured with:
- **Base ID**: `appLkDMJZrxnOCpPF`
- **Table ID**: `tblwfa8UVh8Uoigp5` (Football Players table)

These are set in:
- `app/api/airtable/search-players/route.ts`
- `app/api/airtable/get-player/route.ts`

If your base/table IDs are different, update them in these files.

## Step 4: Test the Integration

1. **Restart your development server**
   ```bash
   npm run dev
   ```

2. **Test player search**
   - Go to http://localhost:3000
   - Search for a player like "Kylian Mbappé" or "Erling Haaland"
   - You should see results from your Airtable table

3. **Check the console**
   - Open browser DevTools (F12)
   - Check the Console tab for any errors
   - Check the Network tab to see API calls

## Troubleshooting

### "AIRTABLE_API_KEY not set" Error
- Make sure `.env.local` exists in the project root
- Verify the API key is correctly formatted (starts with `pat`)
- Restart your development server after adding the key

### "Airtable API error: 401 Unauthorized"
- Your API key might be invalid or expired
- Check that the token has the correct scopes
- Verify the token has access to the correct base

### "Airtable API error: 404 Not Found"
- Check that the Base ID and Table ID are correct
- Verify the "Football Players" table exists in your base
- Make sure the table name matches exactly

### "No players found"
- Check that players exist in your Airtable table
- Verify the "Player Name" field exists and has data
- Try searching with exact case (e.g., "KYLIAN MBAPPÉ")

### Search Not Working
- The search is case-insensitive, so "mbappé" should find "KYLIAN MBAPPÉ"
- Check that the "Player Name" field is a text field (not a formula or linked record)
- Verify your API key has `data.records:read` permission

## API Key Security

⚠️ **Important Security Notes:**

1. **Never commit `.env.local` to Git**
   - It should already be in `.gitignore`
   - Double-check before committing

2. **Don't share your API key**
   - Keep it private
   - Don't paste it in chat, emails, or public forums

3. **Rotate keys if compromised**
   - If you suspect your key is exposed, create a new one
   - Delete the old key from Airtable

4. **Use environment-specific keys**
   - Use different keys for development and production
   - Production keys should have minimal required permissions

## Rate Limits

Airtable free tier limits:
- **5 requests per second** per base
- No daily limit
- Higher limits on paid plans

The application handles rate limits gracefully. If you hit limits:
- Wait a moment and try again
- Consider implementing caching for frequently accessed players

## Next Steps

Once set up, you can:
- Search for players in your Airtable table
- Generate PDF reports from Airtable data
- Add more players to your Airtable table
- Update player data directly in Airtable

## Support

If you encounter issues:
1. Check the browser console for errors
2. Verify your API key permissions
3. Test the API key directly using Airtable's API documentation
4. Check that your base and table IDs are correct

