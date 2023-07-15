# CtrlFplus

https://github.com/emcf/CtrlFplus/assets/38445041/e1eed1bb-9e22-4f4c-bc92-1fc9a4d2a946

Chat with Scientific Documents

## Flask API

### Developement

`flask --app app run`

## Front-end

`cd front-end`

### Install [pnpm](https://pnpm.io/installation)

Recommended: `npm install -g pnpm`

### Start dev server

`pnpm run dev --open`

### Staging

`set "VITE_ENV=staging" && pnpm run dev`

### Prod

`set "VITE_ENV=prod" && pnpm run build`

#### Preview

`pnpm run start`

### Test Stripe Locally
In root dir:

`stripe login`

`stripe listen --forward-to localhost:5000/webhook`


