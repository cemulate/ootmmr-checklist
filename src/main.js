import 'purecss/build/pure-min.css';
import 'purecss/build/grids-responsive-min.css';
import './app.css';
import App from './App.svelte';

const app = new App({
    target: document.getElementById('app'),
});

export default app;
