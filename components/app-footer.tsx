export function AppFooter() {
    return (
        <footer className="py-12 border-t border-border bg-muted/20">
            <div className="max-w-4xl mx-auto px-6 text-center">
                <div className="flex flex-wrap justify-center gap-6 mb-8 text-sm text-muted-foreground">
                    <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
                    <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
                    <a href="#" className="hover:text-primary transition-colors">Refund Policy</a>
                    <a href="#" className="hover:text-primary transition-colors">Contact Support</a>
                </div>

                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl inline-block max-w-xl mx-auto mb-8">
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                        ⚠️ Risk Note: Collectibles are digital items for use within the application.
                        They are not investments and have no guaranteed monetary value.
                        All sales are final.
                    </p>
                </div>

                <p className="text-xs text-muted-foreground/50">
                    © {new Date().getFullYear()} Squat Zone Deux. Powered by HandCash.
                </p>
            </div>
        </footer>
    )
}
