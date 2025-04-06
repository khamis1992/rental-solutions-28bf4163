
# RTL Support and Arabic Language Guidelines

This document provides guidelines for maintaining and enhancing RTL (Right-to-Left) support in the application, with a focus on Arabic language implementation.

## Language Selection

- The application supports switching between English and Arabic languages.
- Language selection is handled by the `LanguageSelector` component.
- Language state is managed by the `TranslationContext` and stored in localStorage.

## RTL Implementation

### Global RTL Mode

When the application is switched to Arabic language:

1. The `direction` attribute of the `<html>` element is set to `rtl`.
2. The `rtl-mode` class is added to the `<body>` element.
3. All UI components are automatically adjusted for RTL layout.

### Styling for RTL

- All RTL-specific styles are defined in `src/styles/rtl.css`.
- The CSS file contains comprehensive styles for various UI components in RTL mode.
- Components should use the `getDirectionalClasses` function from `rtl-utils.ts` to handle RTL styling.

## Utility Functions

The application provides several utility functions in `src/utils/rtl-utils.ts` to help with RTL support:

1. `getDirectionalClasses(classes)` - Converts LTR classes to RTL classes when in RTL mode.
2. `getDirectionalFlexClass()` - Returns the appropriate flex direction class.
3. `getDirectionalTextAlign()` - Returns the appropriate text alignment class.
4. `getDirectionalMargin(prefix, size)` - Handles margins correctly in both directions.

## Arabic Font Support

- The application loads the Tajawal font when in Arabic mode.
- Font loading is managed in the `TranslationContext`.
- The `.font-arabic` class is added to the body element in Arabic mode.

## Translation Process

1. All UI text should be wrapped in the `t()` function from react-i18next.
2. Translation keys are organized in the `src/i18n/locales/ar.json` file.
3. For dynamic content, use the `translateText` function from `TranslationContext`.

## Charts and Data Visualization

For charts and graphs in RTL mode:

1. The chart wrapper should maintain LTR direction for correct data visualization.
2. Labels, tooltips, and legends should use RTL direction.
3. X-axis data should be reversed in RTL mode for proper visualization.

## Testing RTL Support

When adding new features or components:

1. Test the component in both LTR and RTL modes.
2. Verify that all text is correctly aligned.
3. Check that all interactive elements work properly.
4. Ensure that the layout flows correctly in RTL mode.

## Common RTL Issues

1. **Flex Direction**: Use `getDirectionalFlexClass()` instead of hardcoding `flex-row`.
2. **Margins/Paddings**: Use `getDirectionalClasses()` to convert margin/padding classes.
3. **Icons**: Use the appropriate icon for each direction (e.g., arrow-left vs arrow-right).
4. **Text Alignment**: Pay attention to text alignment in RTL mode.
5. **Chart Direction**: Charts typically need special handling for RTL support.

## Translation Guidelines

1. Keep translations contextual - use the same term consistently for the same concept.
2. Be aware of text expansion in Arabic - UI layouts should accommodate longer text.
3. Numbers should be formatted according to Arabic standards when in Arabic mode.
4. Dates should follow Arabic conventions when in Arabic mode.
5. Currency symbols should appear on the appropriate side in RTL mode.
