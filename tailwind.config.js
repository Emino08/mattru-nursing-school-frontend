/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ['class'],
    content: [
        './pages/**/*.{ts,tsx}',
        './components/**/*.{ts,tsx}',
        './app/**/*.{ts,tsx}',
        './src/**/*.{ts,tsx}',
    ],
    theme: {
        container: {
            center: true,
            padding: '2rem',
            screens: {
                '2xl': '1400px',
            },
        },
        extend: {
            colors: {
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                primary: {
                    DEFAULT: '#2563EB', // Blue primary color
                    light: '#3B82F6',
                    dark: '#1D4ED8',
                    foreground: 'white',
                },
                secondary: {
                    DEFAULT: '#FF59A1', // Pink secondary color
                    light: '#FF7EB6',
                    dark: '#E0338A',
                    foreground: 'white',
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))',
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))',
                },
                accent: {
                    DEFAULT: '#F0F9FF', // Light blue accent
                    foreground: '#0F172A',
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))',
                },
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))',
                },
                success: {
                    DEFAULT: '#10B981', // Green for success states
                    foreground: 'white',
                },
                warning: {
                    DEFAULT: '#F59E0B', // Amber for warning states
                    foreground: 'white',
                },
                info: {
                    DEFAULT: '#3ABFF8', // Light blue for info states
                    foreground: 'white',
                },
            },
            borderRadius: {
                lg: '0.75rem', // 12px
                md: '0.5rem',  // 8px
                sm: '0.25rem', // 4px
            },
            boxShadow: {
                card: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                button: '0 4px 6px -1px rgba(37, 99, 235, 0.25)',
                'button-hover': '0 8px 9px -4px rgba(37, 99, 235, 0.2), 0 4px 18px 0 rgba(37, 99, 235, 0.1)',
            },
            keyframes: {
                'accordion-down': {
                    from: { height: 0 },
                    to: { height: 'var(--radix-accordion-content-height)' },
                },
                'accordion-up': {
                    from: { height: 'var(--radix-accordion-content-height)' },
                    to: { height: 0 },
                },
                fadeIn: {
                    '0%': { opacity: 0 },
                    '100%': { opacity: 1 },
                },
                slideUp: {
                    '0%': { transform: 'translateY(10px)', opacity: 0 },
                    '100%': { transform: 'translateY(0)', opacity: 1 },
                },
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out',
                fadeIn: 'fadeIn 0.3s ease-in-out',
                slideUp: 'slideUp 0.4s ease-out',
            },
        },
    },
    plugins: [require('tailwindcss-animate')],
};