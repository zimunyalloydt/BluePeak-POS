import { useState } from "react";

export default function MessageInput() {

    const [text, setText] = useState("");

    return (

        <div className="border-t p-4 flex gap-3">

            <input
                className="flex-1 border rounded-lg p-3"
                placeholder="Type a message..."
                value={text}
                onChange={(e) => setText(e.target.value)}
            />

            <button
                className="bg-blue-600 text-white px-5 rounded-lg"
            >
                Send
            </button>

        </div>

    );

}