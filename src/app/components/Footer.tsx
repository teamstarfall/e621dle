interface FooterProps {
    date: string | null;
}

export default function Footer({ date }: FooterProps) {
    return (
        <footer className="flex flex-col sm:grid sm:grid-cols-3 items-center justify-items-center w-full py-3 my-4 sm:my-8 gap-4">
            <span className="justify-self-start flex flex-col text-center sm:text-left">
                <span>
                    Inspired by{" "}
                    <a className="underline" href="https://rule34dle.vercel.app/" target="_blank" rel="noopener noreferrer">
                        Rule34dle
                    </a>
                </span>
                <span>
                    <a
                        className="underline"
                        href="https://github.com/teamstarfall/e621dle"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        e621dle Github Repo
                    </a>
                </span>
            </span>
            <span className="flex flex-col justify-self-center sm:order-none order-first text-center">
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
