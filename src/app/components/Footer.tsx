interface FooterProps {
    date: string | null;
}

export default function Footer({ date }: FooterProps) {
    return (
        <footer className="flex flex-col sm:grid sm:grid-cols-3 text-center items-center justify-items-center w-full py-3 my-4 sm:my-8 gap-4">
            <span className="justify-self-start">
                Inspired by{" "}
                <a className="underline" href="https://rule34dle.vercel.app/" target="_blank" rel="noopener noreferrer">
                    Rule34dle
                </a>
                {" | "}
                <a
                    className="underline"
                    href="https://github.com/teamstarfall/e621dle"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Github Repo
                </a>
            </span>
            <span className="flex flex-col justify-self-center sm:order-none order-first">
                <span>
                    Made with 💚💙 by <b>Team Starfall</b>
                </span>
                <span>
                    (
                    <a className="underline" href="https://angelolz.one" target="_blank" rel="noopener noreferrer">
                        angelolz
                    </a>
                    {" + "}
                    <a className="underline" href="https://twitter.com/azuretoast" target="_blank" rel="noopener noreferrer">
                        AzureToast
                    </a>
                    )
                </span>
            </span>

            {date && <span className="justify-self-end">Data is based on {date}.</span>}
        </footer>
    );
}
