// @ts-nocheck
import { useEffect, useState } from 'react';
// import { Connection, PublicKey } from '@solana/web3.js';
// import { Idl, Program } from '@coral-xyz/anchor';
// import IDL from '../../anchor/mango_v4.json';
// import { MangoV4 } from "../../anchor/mango_v4";

import ActivityBar from "./components/ActivityBar";
import Editor from "./components/Editor";
import Explorer from "./components/Explorer";
import Header from "./components/Header";

function App() {
  // const [accounts, setAccounts] = useState<AccountData[]>([]);
  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState<string | null>(null);

  // useEffect(() => {
  //   (async () => {
  //     try {
  //       const rpcUrl = (window as any).__RPC_URL__ || import.meta.env.VITE_RPC_URL;
  //       console.log(rpcUrl);
  //       console.log(import.meta.env.VITE_RPC_URL);
  //       const connection = new Connection(rpcUrl);

  //       // Fetch IDL from server
  //       // const idl = await fetch('/get-idl').then(res => res.json()) as Idl;
  //       // const idl = IDL;

  //       // const programId = new PublicKey(idl.address || "4MangoMjqJ2firMokCjjGgoK8d4MXcrgL7XJaL3w6fVg");

  //       const program = new Program<MangoV4>(IDL as MangoV4, { connection });

  //       const allAccounts = Object.keys(program.account);
  //       const data = allAccounts.reduce((accumulator, currentValue) => {
  //         accumulator[currentValue] = program.account[currentValue];
  //         return accumulator;
  //       }, {});
  //       console.log("TEST");
  //       console.log(extractAccountsDefinition(IDL as Idl));
  //       // console.log(extractAccountsDefinition(IDL as Idl));

  //       // Fetch accounts - modify based on your IDL
  //       const accounts = await program.account.mintInfo.all();
  //       const filteredAccounts = accounts.slice(0, 10).map(a => {
  //         const { reserved, ...rest } = a.account;
  //         return rest;
  //       });
  //       console.log(filteredAccounts);
  //       // console.log(program.account.);

  //       setAccounts(accounts.map(a => a.account));
  //     } catch (err) {
  //       setError(err instanceof Error ? err.message : 'Unknown error');
  //     } finally {
  //       setLoading(false);
  //     }
  //   })();
  // }, []);

  // if (loading) return <div>Loading...</div>;
  // if (error) return <div>Error: {error}</div>;

  // return (
  //   <div>
  //     <h1>Program Accounts</h1>
  //     {accounts.map((account, i) => (
  //       <pre key={i}>{JSON.stringify(account, null, 2)}</pre>
  //     ))}
  //   </div>
  // );

  const [activeEditorTabs, setActiveEditorTabs] = useState([]);
  const [selectedTabId, setSelectedTabId] = useState(null);

  const handleCloseTab = (tabId) => {
    const updatedActiveEditorTabs = activeEditorTabs.filter((tab) => tab.id !== tabId);

    setActiveEditorTabs(updatedActiveEditorTabs);

    if (activeEditorTabs.length !== 1) {
      setSelectedTabId(updatedActiveEditorTabs.at(-1).id);
    } else {
      setSelectedTabId(null);
    }
  };

  const handleActiveEditorTabs = (tabId, tabName, tabData) => {
    const newTab = {
      id: tabId,
      name: tabName,
      data: tabData,
    };

    const isAlreadyOpened = activeEditorTabs.some((activeTab) => activeTab.id === tabId);

    if (!isAlreadyOpened) {
      setActiveEditorTabs([...activeEditorTabs, newTab]);
      setSelectedTabId(tabId);
    } else {
      setSelectedTabId(tabId);
    }
  };
  return (
    <main className="w-full flex flex-col h-dvh overflow-hidden">
      <Header />
      <section className="w-full h-full flex max-h-full">
        <ActivityBar />
        <Explorer
          handleActiveEditorTabs={handleActiveEditorTabs}
          activeEditorTabs={activeEditorTabs}
          setActiveEditorTabs={setActiveEditorTabs}
          setSelectedTabId={setSelectedTabId}
        />
        <Editor
          activeEditorTabs={activeEditorTabs}
          handleCloseTab={handleCloseTab}
          selectedTabId={selectedTabId}
          setSelectedTabId={setSelectedTabId}
        />
      </section>
    </main>
  );
}

interface Account {
  name: string;
  discriminator: number[];
}

interface Field {
  name: string;
  type: any;
}

interface TypeDef {
  kind: string;
  fields: Field[];
}

interface TypeEntry {
  name: string;
  type: TypeDef;
}

function extractAccountsDefinition(idl: Idl): { [key: string]: TypeDef } {
  const accountTypes: { [key: string]: TypeDef } = {};

  const allTypes = idl.types;
  const allTypesMap = new Map<string, TypeDef>();
  allTypes.forEach((type: TypeEntry) => {
    allTypesMap.set(type.name, type.type);
  });

  // Recursive function to resolve a type reference.
  function resolveType(fieldType: any): any {
    // Primitive types (e.g., "u8", "f32")
    if (typeof fieldType === "string") {
      return fieldType;
    }

    // If the type is a user-defined reference (e.g., { defined: { name: "I80F48" } })
    if (fieldType.defined) {
      const definedName = fieldType.defined.name;
      const resolved = allTypesMap.get(definedName);
      if (!resolved) {
        throw new Error(`Type "${definedName}" is not defined in the type map.`);
      }
      // Recursively resolve the referenced type.
      return resolveType(resolved);
    }

    // If it's a vector type (e.g., { vec: { defined: { name: "TokenEquity" } } })
    if (fieldType.vec) {
      // Resolve inner type. Note: if vec already is a primitive or other form, it still works.
      return { vec: resolveType(fieldType.vec || fieldType.vec ) };
    }

    // If it's an array type (e.g., { array: [ "u8", 5 ] })
    if (fieldType.array) {
      const [innerType, length] = fieldType.array;
      return { array: [resolveType(innerType), length] };
    }

    // If it's a structured type (i.e., a struct with fields)
    if (fieldType.kind && fieldType.fields) {
      return {
        kind: fieldType.kind,
        fields: fieldType.fields.map((field: any) => ({
          name: field.name,
          type: resolveType(field.type)
        }))
      };
    }

    // Fallback: return the field type as is.
    return fieldType;
  }

  idl.accounts.forEach((account: Account) => {
    if (allTypesMap.has(account.name)) {
      const rawType = allTypesMap.get(account.name);
      accountTypes[account.name] = resolveType(rawType);
      console.log(rawType);
    }
  });

  return accountTypes;
}


export default App;