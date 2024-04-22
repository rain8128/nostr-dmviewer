window.onload=()=>{
    const Profiles = new Map();
    const tmp = new Map();
    let ws;
    const connect = document.getElementById("connect");
    const box = document.getElementById("box");
    connect.onclick=()=>{
        const state = document.getElementById("state");
        state.innerText = "connecting...";
        const relayUrl = document.getElementById("relay").value;
        ws = new WebSocket(relayUrl);
        ws.onopen=()=>{state.innerText = "connected";}
        ws.onclose=()=>{state.innerText = "disconnected";}
        ws.onmessage=(m)=>{
            const data=JSON.parse(m.data);
            switch(data[0]){
                case "EVENT":
                    switch(data[2].kind){
                        case 0:
                            Profiles.set(data[2].pubkey,JSON.parse(data[2].content));
                            if(tmp.has(data[2].pubkey)){
                                tmp.get(data[2].pubkey).dispatchEvent(new Event("found"));
                                tmp.delete(data[2].pubkey);
                            }
                            break;
                        case 4:
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
                                content.innerText = "failed to decrypt";
                            });
                            getProfile(data[2].pubkey).then(profile=>{
                                pubkey.innerText = profile.name;
                            });
                            break;
                        }
                    break;
                case "EOSE":
                    if(!data[1].startsWith("profile:")){return;}
                    const pubkey = data[1].match(/profile:(.+)/)[1];
                    if(!Profiles.has(pubkey)){
                        Profiles.set(pubkey,null);
                        tmp.get(pubkey).dispatchEvent(new Event("not found"));
                        tmp.delete(pubkey);
                    }
                    break;
            }

            function getProfile(pubkey){
                return new Promise((resolve,reject)=>{
                    if(Profiles.has(pubkey)){
                        const profile = Profiles.get(pubkey);
                        if(profile!=null){
                            resolve(profile);
                        }else{
                            reject("not found");
                        }
                    }
                    if(tmp.has(pubkey)){
                        const et = tmp.get(pubkey);
                        et.addEventListener("found",()=>resolve(Profiles.get(pubkey)));
                        et.addEventListener("not found",()=>reject("not found"));
                        
                    }else{
                        const et = new EventTarget();
                        et.addEventListener("found",()=>resolve(Profiles.get(pubkey)));
                        et.addEventListener("not found",()=>reject("not found"));
                        tmp.set(pubkey,et);
                        ws.send(JSON.stringify(["REQ","profile:"+pubkey,{kinds:[0],authors:[pubkey],limit:1}]));
                    }
                })
            };
        }
    }
    const get = document.getElementById("get");
    get.onclick=async ()=>{
        const pubkey = await nostr.getPublicKey();
        ws.send(JSON.stringify(["CLOSE","_"]))
        ws.send(JSON.stringify(["REQ","_",{"#p":[pubkey],kinds:[4],limit:10}]))
    }
}
