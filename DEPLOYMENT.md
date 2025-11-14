# GitHub Pages Deployment Guide

This application is ready to deploy to GitHub Pages. Follow these steps:

## Deployment Steps

1. **Commit all files to your repository**
   ```bash
   git add .
   git commit -m "Add SMA Outfit Analysis web application"
   git push origin cursor/stock-market-sma-analysis-web-app-3620
   ```

2. **Enable GitHub Pages**
   - Go to your repository on GitHub
   - Click on "Settings"
   - Scroll down to "Pages" section
   - Under "Source", select the branch: `cursor/stock-market-sma-analysis-web-app-3620`
   - Select folder: `/ (root)`
   - Click "Save"

3. **Wait for deployment**
   - GitHub Pages will build and deploy your site
   - This usually takes 1-2 minutes
   - You'll see a green checkmark when deployment is complete

4. **Access your site**
   - Your site will be available at:
     `https://[your-username].github.io/[repository-name]/`
   - Or if using a custom domain, configure it in Pages settings

## File Structure

The application consists of:
- `index.html` - Main application page
- `styles.css` - Application styling
- `app.js` - Main application logic
- `api-config.js` - API configuration and data fetching
- `sma-calculator.js` - SMA calculations and signal detection
- `.nojekyll` - Tells GitHub Pages to skip Jekyll processing

## Notes

- The application is client-side only (no backend required)
- All configuration is stored in browser localStorage
- API calls are made directly from the browser (CORS must be enabled by API providers)
- Some APIs may have rate limits on free tiers

## Troubleshooting

### CORS Issues
If you encounter CORS errors:
- Yahoo Finance API should work without CORS issues
- Other APIs may require CORS proxy or backend proxy
- Consider using a CORS proxy service if needed

### API Rate Limits
- Free API tiers have rate limits
- The application includes delays to respect rate limits
- If you hit limits, wait a few minutes or upgrade your API plan

### Page Not Loading
- Ensure `.nojekyll` file exists in root directory
- Check that all JavaScript files are in the root directory
- Verify file paths in `index.html` are correct

## Custom Domain (Optional)

To use a custom domain:
1. Add a `CNAME` file with your domain name
2. Configure DNS settings with your domain provider
3. Update GitHub Pages settings with your custom domain
