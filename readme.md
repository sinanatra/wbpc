- `cd admin`
- `composer install`
- `composer update`
- `composer start`
- Create an API user at `{url}/panel`.

Separately install dependencies with yarn
```
cd ../
yarn
```

Run and build the development environment.
```
yarn dev
yarn build
```

## Folder structure and important files

```
.
├─── admin
│    ├── content
│    ├── kirby
│    ├── media
│    ├── site
│    │   ├── blueprints
│    │   │   └── users
│    │   │       ├── api.yml
│    │   │       └── default.yml
│    │   ├── config
│    │   │   └── config.php
│    │   └── plugins
│    │       └── kql
│    └── vendor
│    
├── src
│    ├── components
│    └── routes
│        ├── +layout.svelte
│        ├── +page.svelte
│        ├── +page.js
│        └── api
│            └── query
│                └── +server.js
├── static
├── package.json
└── svelte.config.js

```
