export default function ChatItem({ chat }) {

    return (

        <div className="p-4 border-b hover:bg-gray-100 cursor-pointer">

            <div className="flex justify-between">

                <strong>{chat.name}</strong>

                {chat.unread > 0 && (

                    <span className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">

                        {chat.unread}

                    </span>

                )}

            </div>

            <p className="text-gray-500">

                {chat.lastMessage}

            </p>

        </div>

    );

}