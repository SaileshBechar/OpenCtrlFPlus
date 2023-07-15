# CtrlFplus

https://github.com/SaileshBechar/OpenCtrlFPlus/assets/38445041/16560fd0-c56f-4d80-9076-60514cd74a49


https://github.com/SaileshBechar/OpenCtrlFPlus/assets/38445041/eb70cd7a-b7ee-410c-bfef-b1f7205c34ff


https://github.com/SaileshBechar/OpenCtrlFPlus/assets/38445041/b6d17771-4b60-49a5-a092-a9be3c222d9c



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


