import { mount } from 'cypress/react';
import './commands';
import '@/app/globals.css';

Cypress.Commands.add('mount', mount);
