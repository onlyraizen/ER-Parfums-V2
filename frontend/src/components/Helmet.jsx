import { useEffect } from 'react';

export default function Helmet({ title }) {
    useEffect(() => {
        document.title = title || 'ER Parfums';
    }, [title]);

    return null; // This component doesn't render any visible UI
}