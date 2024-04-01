import 'purecss/build/base-min.css';
import 'purecss/build/buttons-min.css';
import 'purecss/build/forms-nr-min.css';
import './styles/flex.css';
import './styles/main.css';
import App from './App.svelte';

const app = new App({
    target: document.getElementById('app'),
});

export default app;
