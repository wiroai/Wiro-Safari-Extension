import '../core/src/ui/styles.css';
import './popup-size.css';
import { mountPanel } from '../core/src/ui/app.js';
import { safariPlatform } from './platform.js';

const root = document.getElementById('app');
if (root) mountPanel(root, safariPlatform);
