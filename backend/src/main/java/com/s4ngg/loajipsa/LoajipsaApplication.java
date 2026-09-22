package com.s4ngg.loajipsa;

import com.s4ngg.loajipsa.config.DotenvLoader;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@ConfigurationPropertiesScan
@SpringBootApplication
public class LoajipsaApplication {

	public static void main(String[] args) {
		DotenvLoader.load();
		SpringApplication.run(LoajipsaApplication.class, args);
	}

}
