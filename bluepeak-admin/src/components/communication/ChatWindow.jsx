import MessageInput from "./MessageInput";

export default function ChatWindow() {

    return (

        <div className="flex-1 flex flex-col">

            <div className="p-4 border-b font-bold">

                Administrator

            </div>

            <div className="flex-1 p-5 overflow-y-auto">

                Messages go here

            </div>

            <MessageInput />

        </div>

    );

}