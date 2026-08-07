import ChatItem from "./ChatItem";

const chats = [
    {
        id: 1,
        name: "Administrator",
        lastMessage: "Please count drinks.",
        unread: 2
    },
    {
        id: 2,
        name: "Peter",
        lastMessage: "Done.",
        unread: 0
    }
];

export default function ChatList() {
    return (
        <div className="w-80 border-r overflow-y-auto">

            {chats.map(chat => (
                <ChatItem
                    key={chat.id}
                    chat={chat}
                />
            ))}

        </div>
    );
}