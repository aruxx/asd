# GitHub Pages Deployment Guide

## Quick Setup

1. **Enable GitHub Pages**:
   - Go to: https://github.com/aruxx/asd/settings/pages
   - Under "Source", select branch: `cursor/stock-market-sma-analysis-web-app-d356`
   - Select folder: `/ (root)`
   - Click "Save"

2. **Wait for Deployment**:
   - GitHub will build and deploy your site (usually takes 1-2 minutes)
   - You'll see a green checkmark when deployment is complete

3. **Access Your Site**:
   - Your site will be available at: `https://aruxx.github.io/asd/`
   - Or check the "Pages" section in Settings for the exact URL

## File Structure

All files are in the root directory:
- `index.html` - Main application file
- `styles.css` - Styling
- `app.js` - Main application logic
- `scanner.js` - Scanning engine
- `api-handlers.js` - API integration
- `sma-outfits.js` - SMA configurations
- `.nojekyll` - Disables Jekyll processing (required for vanilla JS)

## Troubleshooting

### Site Not Loading
- Check that `.nojekyll` file exists in the root
- Verify all JavaScript files are in the root directory
- Check browser console for errors

### API Errors
- Ensure API keys are properly configured
- Check API rate limits
- Try a different API provider

### CORS Issues
- Some APIs may have CORS restrictions
- Consider using a backend proxy for production use
- Yahoo Finance should work without CORS issues

## Custom Domain (Optional)

To use a custom domain:
1. Add a `CNAME` file with your domain name
2. Configure DNS settings as per GitHub Pages documentation
3. Update domain in repository settings
