<p align="center">
  <a href="https://ylide.io">
  <img title="Ylide Protocol" src='https://fra1.digitaloceanspaces.com/ylide-cdn/ylide-logo-github-io.svg' width="400px"/>
  </a>
</p>

<br />



<p align="center">
<a href="https://docs.ylide.io"><img src="https://img.shields.io/static/v1?label=docs&message=docs.ylide.io&color=red" alt="Ylide Documentation"></a>
<a href="https://discord.gg/ylide"><img src="https://img.shields.io/badge/discord-join-blue.svg" alt="Ylide Discord"></a>
</p>

<table border="0" style="border: 0"><tr>
  <td>
    <img src="https://ylide.io/hub/img/pic/slide-6-min.png" />
  </td>  
  <td>
    <img src="https://ylide.io/hub/img/pic/slide-5-min.png" />
  </td>  
</tr></table>

**[Ylide Protocol](https://ylide.io/?utm_source=gh)** is an open-source cross-chain wallet-to-wallet communications solution for Web3 projects. We anticipate that for the mass adoption of the Web3 it is crucial to have native decentralized and secure communications layer.
That's what's Ylide purpose is.

<a href="#"><img align="right" src="https://fra1.digitaloceanspaces.com/ylide-cdn/icons/start.png" width="40px" height="40px"/></a>
## Quick Start

For all examples we will use EVM connectors for Polygon from @ylide/ethereum.
To install core of the SDK, run:

```bash
npm install --save @ylide/sdk
```

On the next step you should install some blockchain connector to be able to read and send messages:

```bash
npm install --save @ylide/ethereum
```

So, first of all you should import these connectors:

```typescript
import { evmBlockchainFactories, evmWalletFactories, EVMNetwork } from '@ylide/ethereum';
```

Afterward, you should register them in the Ylide singleton:

```typescript
Ylide.registerBlockchainFactory(evmBlockchainFactories[EVMNetwork.POLYGON]);
Ylide.registerWalletFactory(evmWalletFactories.metamask);
```

You can easily verify availability of MetaMask (or other Ethereum wallet) in user’s browser:

```typescript
const isWalletAvailable = await evmWalletFactories.metamask.isWalletAvailable();
```

<a href="#"><img align="right" src="https://fra1.digitaloceanspaces.com/ylide-cdn/icons/folder.png" width="40px"/></a>
## Documentation

Please see our full documentation [here](https://docs.ylide.io). You can start with:

* [Getting started](https://docs.ylide.io/use-ylide/getting-started) - How to initalize SDK and create your first project using Ylide
* [Initializing communication keys](https://docs.ylide.io/use-ylide/initializing-communication-keys) - How to work with Ylide communication keys
* [Sending messages](https://docs.ylide.io/use-ylide/sending-message) - How to send on-chain messages
* [Reading messages](https://docs.ylide.io/use-ylide/reading-message) - How to read messages from multiple blockchains


<a href="#"><img align="right" src="https://fra1.digitaloceanspaces.com/ylide-cdn/icons/community.png" width="40px"/></a>
## Reporting Bugs and Contributing Code

* Want to report a bug or request a feature? Please open [an issue](https://github.com/ylide-io/mail/issues/new).
* Want to build something amazing with **Ylide**? Fork the project, and [check out our issues](https://github.com/ylide-io/mail/issues).
* Join our [Discord](https://discord.gg/ylide) to ask any question!
* [ignat@ylide.io](mailto:ignat@ylide.io) - for business inquiries - send us an email
