window.onload=()=>{
    let ws;
    const connect = document.getElementById("connect");
    const box = document.getElementById("box");
    connect.onclick=()=>{
        const state = document.getElementById("state");
        state.innerText = "connecting...";
        const relayUrl = document.getElementById("relay").value;
        ws = new WebSocket(relayUrl);
        ws.onopen=()=>{state.innerText = "connected";}
        ws.onclose=()=>{state.innerText = "closed";}
        ws.onmessage=(m)=>{
            const data=JSON.parse(m.data);
            if(data[0]=="EVENT"){
                const pubkey = document.createElement("div");
                pubkey.innerText = data[2].pubkey;
                const content = document.createElement("div");
                content.innerText = "decrypting...";
                const message = document.createElement("div");
                message.className = "message";
                message.appendChild(pubkey);
                message.appendChild(content);
                box.prepend(message);
                nostr.nip04.decrypt(data[2].pubkey,data[2].content).then(text=>{
                    content.innerText = text;
                },()=>{
                    content.innerText = "failed to decrypt"
                })
            }
        }
    }
    const get = document.getElementById("get");
    get.onclick=async ()=>{
        const pubkey = await nostr.getPublicKey();
        ws.send(JSON.stringify(["CLOSE","_"]))
        ws.send(JSON.stringify(["REQ","_",{"#p":[pubkey],kinds:[4],limit:10}]))
    }
}
