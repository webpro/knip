import { faker } from '@faker-js/faker';

function login() {
  return faker;
}

Cypress.Commands.add('login', login);
