# Wedding Seating App

A simple, elegant frontend-only wedding seating application that allows guests to find their table and check in. Features a beautiful visual floor plan with white and dark green theming.

## Features

- **Guest Search**: Case-insensitive search with partial name matching
- **Visual Floor Plan**: Interactive SVG-based table layout
- **Check-in System**: localStorage-based check-in tracking
- **Mobile Responsive**: Works perfectly on phones, tablets, and desktop
- **Elegant Design**: Clean white and dark green theme
- **No Backend Required**: Pure frontend solution

## Quick Start

1. Open `index.html` in any modern web browser
2. Guests can search for their name to find their table
3. The app will show their table location on the visual floor plan
4. Guests can check in, and their status will be saved locally

## File Structure

```
wedding-seating/
├── index.html          # Main guest interface
├── styles.css          # Styling and theme
├── script.js           # All functionality
├── data/
│   ├── guests.json     # Guest name to table mappings
│   └── tables.json     # Table positions and layout
└── README.md           # This file
```

## Updating Guest List

Edit `data/guests.json` to add, remove, or modify guest assignments:

```json
{
  "Guest Name": "Table Number",
  "John Smith": "Table 1",
  "Jane Smith": "Table 1",
  "Mr. & Mrs. Johnson": "Table 2"
}
```

### Guest Name Tips:
- Include multiple variations (e.g., "John Smith", "Mr. & Mrs. Smith")
- Use family names for groups (e.g., "Smith Family")
- The search is flexible and will match partial names

## Updating Table Layout

Edit `data/tables.json` to modify table positions:

```json
{
  "tables": [
    {
      "number": "Table 1",
      "x": 150,
      "y": 200,
      "radius": 30
    }
  ]
}
```

### Table Configuration:
- **number**: Table identifier (must match guest assignments)
- **x, y**: Position coordinates (0-800 for x, 0-600 for y)
- **radius**: Table size (30 is standard)

### Layout Tips:
- The floor plan is 800x600 pixels
- Stage area is at the top (y: 50-130)
- Dance floor is in the center (x: 320-480, y: 270-430)
- Leave space around the dance floor for easy navigation

## Check-in System

The app uses browser localStorage to track check-ins:

- **Per Device**: Each device tracks its own check-ins
- **Persistent**: Data survives browser refresh
- **Privacy**: No external servers, completely local

### Debug Functions (Browser Console):
- `getCheckedInGuests()` - View all checked-in guests
- `clearAllCheckIns()` - Reset all check-ins (for testing)

## Customization

### Colors
Edit CSS variables in `styles.css`:
```css
:root {
    --primary-green: #2D5016;    /* Main green color */
    --light-green: #E8F5E8;      /* Light background */
    --accent-green: #4A7C59;     /* Hover states */
}
```

### Fonts
Current fonts: Playfair Display (headings) + Inter (body)
Change the Google Fonts import in `styles.css` to use different fonts.

### Layout
Modify the floor plan background in `script.js`:
- `addFloorPlanBackground()` function
- Adjust stage, dance floor, or add new elements

## Deployment

### Local Testing
Simply open `index.html` in a web browser.

### Web Hosting
Upload all files to any web hosting service:
- GitHub Pages (free)
- Netlify (free)
- Vercel (free)
- Any traditional web host

### Requirements
- Modern web browser with JavaScript enabled
- No server-side requirements
- Works offline after initial load

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Full support

## Troubleshooting

### Guest Not Found
- Check spelling in `guests.json`
- Ensure guest name matches exactly
- Try searching with partial names

### Tables Not Showing
- Verify `tables.json` format
- Check browser console for errors
- Ensure table numbers match between files

### Check-in Not Working
- Enable JavaScript in browser
- Check if localStorage is available
- Clear browser cache if needed

## Sample Data

The app comes with sample data for 20 tables and 60+ guests. Replace with your actual guest list and table layout before your wedding.

## Support

This is a simple, self-contained application. For modifications:
1. Basic HTML/CSS knowledge for styling changes
2. JavaScript knowledge for functionality changes
3. JSON editing for data updates

## License

Free to use and modify for your wedding. No attribution required.

---

**Congratulations on your upcoming wedding!** 🎉
