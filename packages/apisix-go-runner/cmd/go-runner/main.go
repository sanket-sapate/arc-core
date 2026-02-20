package main

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"
	"go.uber.org/zap/zapcore"

	// Register custom plugins via init()
	_ "github.com/arc-self/packages/apisix-go-runner/plugins"

	"github.com/apache/apisix-go-plugin-runner/pkg/runner"
)

func newRunCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "run",
		Short: "Start the APISIX Go Plugin Runner",
		Run: func(cmd *cobra.Command, _ []string) {
			cfg := runner.RunnerConfig{
				LogLevel: zapcore.InfoLevel,
			}
			runner.Run(cfg)
		},
	}
	return cmd
}

func main() {
	root := &cobra.Command{
		Use:  "go-runner [command]",
		Long: "APISIX Go Plugin Runner for Arc microservices",
	}

	root.AddCommand(newRunCommand())

	if err := root.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err.Error())
		os.Exit(1)
	}
}
