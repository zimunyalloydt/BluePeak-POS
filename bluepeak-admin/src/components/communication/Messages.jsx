import ChatList from "./ChatList";
import ChatWindow from "./ChatWindow";

export default function Messages() {

    return (

        <div className="bg-white rounded-xl shadow h-[80vh] flex">

            <ChatList />

            <ChatWindow />

        </div>

    );

}